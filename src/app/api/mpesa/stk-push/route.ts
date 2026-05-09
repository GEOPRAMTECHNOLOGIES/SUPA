import { NextRequest, NextResponse } from 'next/server';
import { initiateStkPush } from '@/lib/mpesa';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, name, email, items } = await req.json();

    if (!phone || !amount || !name || !email) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: phone, amount, name, email' },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneRegex = /^(\+?254|0)[17]\d{8}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number. Use format 07XXXXXXXX or 254XXXXXXXXX' },
        { status: 400 }
      );
    }

    if (amount < 1) {
      return NextResponse.json({ success: false, message: 'Amount must be at least KES 1' }, { status: 400 });
    }

    // Initiate STK Push
    const mpesaRes = await initiateStkPush(
      phone,
      amount,
      `GMART-${Date.now()}`,
      'GreenMart Supermarket Purchase'
    );

    if (mpesaRes.ResponseCode !== '0') {
      return NextResponse.json(
        { success: false, message: mpesaRes.CustomerMessage || 'STK Push failed' },
        { status: 400 }
      );
    }

    // Save pending sale to Supabase
    const db = supabaseAdmin();
    const { error } = await db.from('supa_shop_sales').insert({
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      transaction_code: '',
      amount,
      items: items || '',
      status: 'pending',
      mpesa_checkout_id: mpesaRes.CheckoutRequestID,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      // Don't fail the request — STK push was successful
    }

    return NextResponse.json({
      success: true,
      message: 'STK Push sent. Enter your M-Pesa PIN to complete payment.',
      checkoutRequestId: mpesaRes.CheckoutRequestID,
      merchantRequestId: mpesaRes.MerchantRequestID,
    });
  } catch (error: any) {
    console.error('STK Push error:', error?.response?.data || error.message);
    return NextResponse.json(
      { success: false, message: error?.response?.data?.errorMessage || 'STK Push failed. Please try manual payment.' },
      { status: 500 }
    );
  }
}
