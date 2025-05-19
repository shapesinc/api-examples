
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const AUTH_BASE_URL = "https://api.shapes.inc/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, oneTimeCode } = body;

    if (!appId || !oneTimeCode) {
      return NextResponse.json({ message: 'Missing app_id or oneTimeCode' }, { status: 400 });
    }

    const response = await fetch(`${AUTH_BASE_URL}/nonce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, code: oneTimeCode }),
    });

    const data = await response.json();

    if (response.ok && data.auth_token) {
      return NextResponse.json({ auth_token: data.auth_token }, { status: 200 });
    } else {
      return NextResponse.json({ message: data.message || 'Failed to exchange code for token.' }, { status: response.status });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: `Server error: ${errorMessage}` }, { status: 500 });
  }
}
