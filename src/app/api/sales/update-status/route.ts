import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'ID and status are required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'confirmed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();
    const { error } = await db
      .from('supa_shop_sales')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ success: false, message: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Order ${status} successfully` });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
