import { NextResponse } from 'next/server';

export async function GET() {
  // Mock issuer info
  return NextResponse.json({
    did: 'did:ethr:0x1234567890123456789012345678901234567890',
    address: '0x1234567890123456789012345678901234567890',
    name: 'Demo Issuer',
    ensDomain: 'demo-issuer.eth',
    trusted: true
  });
} 