
import type { NextRequest } from 'next/server';

import { getHandlers } from '~/lib/auth/auth';

function toMutableResponse(response: Response) {
  const headers = new Headers(response.headers);
  const setCookie = (
    response.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie?.();

  if (setCookie?.length) {
    headers.delete('set-cookie');
    for (const cookie of setCookie) {
      headers.append('set-cookie', cookie);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Dynamic handlers that initialize Auth.js with D1 adapter per-request
export async function GET(request: NextRequest) {
  const { GET } = await getHandlers();
  const response = await GET(request);
  return toMutableResponse(response);
}

export async function POST(request: NextRequest) {
  const { POST } = await getHandlers();
  const response = await POST(request);
  return toMutableResponse(response);
}
