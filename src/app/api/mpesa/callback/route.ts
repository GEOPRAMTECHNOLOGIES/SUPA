import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[M-Pesa Callback]', JSON.stringify(body, null, 2));

    const stk = body?.Body?.stkCallback;
    if (!stk) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stk;

    const db = supabaseAdmin();

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      // Payment successful — extract metadata
      const items: Array<{ Name: string; Value: any }> = CallbackMetadata.Item;
      const get = (name: string) => items.find(i => i.Name === name)?.Value;

      const amount = get('Amount');
      const mpesaReceiptNumber = get('MpesaReceiptNumber');
      const phoneNumber = get('PhoneNumber');
      const transactionDate = get('TransactionDate');

      await db
        .from('supa_shop_sales')
        .update({
          status: 'confirmed',
          transaction_code: mpesaReceiptNumber || '',
          amount: amount,
        })
        .eq('mpesa_checkout_id', CheckoutRequestID);

      console.log(`[M-Pesa] Payment confirmed: ${mpesaReceiptNumber} | KES ${amount} | ${phoneNumber}`);
    } else {
      // Payment failed or cancelled
      await db
        .from('supa_shop_sales')
        .update({ status: 'rejected' })
        .eq('mpesa_checkout_id', CheckoutRequestID);

      console.log(`[M-Pesa] Payment failed: ${ResultDesc}`);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('[M-Pesa Callback Error]', error);
    // Always return 200 to Safaricom
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}

// Safaricom validation endpoint
export async function GET() {
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
