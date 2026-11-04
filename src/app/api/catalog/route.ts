import { NextResponse } from 'next/server';
import { DEFAULT_CATALOG } from '@/lib/catalogData';

export async function GET() {
  return NextResponse.json(DEFAULT_CATALOG);
}
