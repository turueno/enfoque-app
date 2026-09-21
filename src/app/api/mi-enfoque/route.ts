import { NextResponse } from 'next/server';
import { getMiEnfoque } from '@/lib/queries';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || 'P01';
  const data = getMiEnfoque(id);
  if (!data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(data);
}
