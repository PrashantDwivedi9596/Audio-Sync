import { NextResponse } from 'next/server';

export function middleware(request) {
  // Socket.io path handling
  if (request.nextUrl.pathname.startsWith('/api/socket')) {
    // Special handling for WebSocket upgrade requests
    if (request.headers.get('upgrade') === 'websocket') {
      return NextResponse.next();
    }
    
    // For non-WebSocket requests to the socket path
    return NextResponse.next();
  }
  
  // Let all other requests pass through
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/socket/:path*'],
}; 