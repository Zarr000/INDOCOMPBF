import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
