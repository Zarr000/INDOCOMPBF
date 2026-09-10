import { NextResponse } from 'next/server';

export async function POST() {
  // Browser auth uses Supabase Auth directly in the client. Never accept or
  // echo credentials through this compatibility endpoint.
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
