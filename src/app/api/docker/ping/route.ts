import { NextResponse } from 'next/server';
import { pingDocker } from '@/lib/docker';

export async function GET() {
  const result = await pingDocker();
  if (result.success) {
    return NextResponse.json(result);
  }
  return NextResponse.json(result, { status: 500 });
}
