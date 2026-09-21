import { NextResponse } from 'next/server';
import { searchAll } from '@/lib/queries';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const results = searchAll(q);
  return NextResponse.json(results);
}
