import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { formatVtResponse } from '../utils';
import { getCachedResult, setCachedResult } from '../cache';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'VirusTotal API key is not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > 32 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size exceeds 32MB limit' }, { status: 400 });
    }

    // Step 1: Pre-Hash the file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Step 2: Check Local Cache First
    const cachedData = getCachedResult(hash);
    if (cachedData) {
        return NextResponse.json(cachedData);
    }

    // Step 3: Check if VT already knows this file
    const getOptions = {
      method: 'GET',
      headers: { accept: 'application/json', 'x-apikey': apiKey }
    };
    const checkRes = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, getOptions);
    
    if (checkRes.ok) {
        const fileData = await checkRes.json();
        const formatted = formatVtResponse(fileData.data);
        setCachedResult(hash, formatted); // Save to cache!
        return formatted;
    }

    // Step 3: If not found, upload it
    const vtFormData = new FormData();
    vtFormData.append('file', new Blob([buffer]), file.name);

    const postOptions = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'x-apikey': apiKey,
      },
      body: vtFormData as any
    };

    const submitRes = await fetch('https://www.virustotal.com/api/v3/files', postOptions);
    const submitData = await submitRes.json();

    if (submitData.error) {
       return NextResponse.json({ error: submitData.error.message }, { status: 400 });
    }

    // Return queued state so frontend can poll
    return NextResponse.json({
        status: 'queued',
        analysisId: submitData.data.id,
        message: 'File submitted successfully. Analysis in progress...',
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

