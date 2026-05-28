import { NextResponse } from 'next/server';
import { formatVtResponse } from '../../utils';
import { setCachedResult } from '../../cache';

export async function POST(req: Request) {
  try {
    const { analysisId, targetId } = await req.json();

    if (!analysisId) {
      return NextResponse.json({ error: 'Missing analysis ID' }, { status: 400 });
    }

    // SSRF Prevention: Validate that analysisId only contains safe characters (alphanumeric, -, _, =, :)
    // This prevents path traversal or URL manipulation attacks flagged by CodeQL.
    if (!/^[A-Za-z0-9\-\_\=\:]+$/.test(analysisId)) {
      return NextResponse.json({ error: 'Invalid analysis ID format' }, { status: 400 });
    }

    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'VirusTotal API key is not configured' }, { status: 500 });
    }

    const getOptions = {
        method: 'GET',
        headers: { accept: 'application/json', 'x-apikey': apiKey }
    };

    // 1. Check Analysis Status
    const analysisRes = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, getOptions);
    const analysisData = await analysisRes.json();
    
    if (analysisData.error) {
        return NextResponse.json({ error: analysisData.error.message }, { status: 400 });
    }

    const status = analysisData.data.attributes.status;

    if (status === 'queued' || status === 'in_progress') {
        return NextResponse.json({ 
            status: 'queued', 
            message: 'Analysis in progress...',
            analysisId: analysisId
        });
    }

    // 2. Analysis is completed! Fetch the full object (File or URL) to get rich details.
    // VT provides the link to the full object in `links.item`
    const itemUrl = analysisData.data.links?.item;
    
    if (!itemUrl) {
        // Fallback to analysis data if no item link is provided (rare)
        return NextResponse.json(formatVtResponse(analysisData.data));
    }

    // SSRF Prevention: Ensure the URL provided by the API actually points to VirusTotal
    if (!itemUrl.startsWith('https://www.virustotal.com/api/v3/')) {
        return NextResponse.json({ error: 'Invalid item URL from upstream' }, { status: 502 });
    }

    const itemRes = await fetch(itemUrl, getOptions);
    const itemData = await itemRes.json();

    if (itemData.error) {
       return NextResponse.json({ error: itemData.error.message }, { status: 400 });
    }

    // Return the deeply formatted full object response
    const formattedResponse = formatVtResponse(itemData.data);
    
    // Save to Cache if targetId was passed!
    if (targetId) {
        setCachedResult(targetId, formattedResponse);
    }
    
    return NextResponse.json(formattedResponse);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
