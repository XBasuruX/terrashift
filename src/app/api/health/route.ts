import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', model_version: '1.0.0' });
}
