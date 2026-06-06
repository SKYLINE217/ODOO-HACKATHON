import { NextRequest, NextResponse } from 'next/server';
import { handleDbQuery } from '@/lib/mysqlQuery';

export async function POST(request: NextRequest) {
  try {
    const { table, chain } = await request.json();

    if (!table) {
      return NextResponse.json({ data: null, error: { message: 'Table name is required' } }, { status: 400 });
    }

    const result = await handleDbQuery(table, chain);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('API Database Route Error:', err);
    return NextResponse.json({ data: null, error: { message: err.message || 'Database error occurred' } }, { status: 500 });
  }
}
