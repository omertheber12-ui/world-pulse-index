import { NextResponse } from 'next/server';
import ids from './lib/knownConnectionIds.json';

const known = new Set(ids);

export function middleware(request) {
  const match = request.nextUrl.pathname.match(/^\/connections\/([^/]+)$/);
  if (!match) return NextResponse.next();
  let id = match[1];
  try { id = decodeURIComponent(id); } catch { /* keep the raw segment */ }
  if (known.has(id)) return NextResponse.next();
  return new NextResponse('This page could not be found.', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

export const config = {
  matcher: ['/connections/:pair_id'],
};
