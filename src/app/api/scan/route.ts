import { NextResponse } from 'next/server';
import { formatVtResponse } from '../utils';
import { getCachedResult } from '../cache';
import { isRateLimited } from '../ratelimit';

const HASH_REGEX = /^[a-fA-F0-9]{32,64}$/;

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    if (await isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const { type, payload } = body;

    if (!['url', 'qr', 'hash'].includes(type) || typeof payload !== 'string' || payload.length > 2048) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    // Check Local Cache First (Lightning fast, saves API limits)
    const cachedData = await getCachedResult(payload);
    if (cachedData) {
        return NextResponse.json(cachedData);
    }

    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'VirusTotal API key is not configured' }, { status: 500 });
    }

    if (type === 'hash') {
      if (!HASH_REGEX.test(payload)) {
        return NextResponse.json({ error: 'Invalid hash format' }, { status: 400 });
      }

      const getOptions = {
        method: 'GET',
        headers: { accept: 'application/json', 'x-apikey': apiKey }
      };
      
      const fileRes = await fetch(`https://www.virustotal.com/api/v3/files/${payload}`, getOptions);
      const fileData = await fileRes.json();

      if (fileData.error) {
        return NextResponse.json({ error: fileData.error.message }, { status: 400 });
      }
      
      return NextResponse.json(formatVtResponse(fileData.data));
    } 
    
    // URL / QR flow
    const formData = new URLSearchParams();
    formData.append("url", payload);

    const postOptions = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'x-apikey': apiKey,
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    };

    const submitRes = await fetch('https://www.virustotal.com/api/v3/urls', postOptions);
    const submitData = await submitRes.json();

    if (submitData.error) {
       return NextResponse.json({ error: submitData.error.message }, { status: 400 });
    }

    return NextResponse.json({
        status: 'queued',
        analysisId: submitData.data.id,
        targetId: payload, // Pass target back to frontend so it can be passed to status checker for caching
        message: 'Target submitted. Analysis is currently queued in VirusTotal.',
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


