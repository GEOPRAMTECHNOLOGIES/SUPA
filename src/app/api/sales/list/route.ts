import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from('supa_shop_sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json({ success: false, message: 'Failed to fetch sales' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
