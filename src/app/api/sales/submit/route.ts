import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const MAX_SIZE = parseInt(process.env.MAX_IMAGE_SIZE || '5242880');
const ALLOWED_TYPES = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');
const BUCKET = 'payment-proofs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const transactionCode = formData.get('transactionCode') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const items = formData.get('items') as string;
    const proofFile = formData.get('proof') as File | null;

    // Validate required fields
    if (!name || !email || !phone || !transactionCode) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: name, email, phone, transactionCode' },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: 'Invalid email address' }, { status: 400 });
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 });
    }

    const db = supabaseAdmin();
    let proofUrl: string | null = null;

    // Handle image upload
    if (proofFile && proofFile.size > 0) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(proofFile.type)) {
        return NextResponse.json(
          { success: false, message: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
          { status: 400 }
        );
      }

      // Validate file size
      if (proofFile.size > MAX_SIZE) {
        return NextResponse.json(
          { success: false, message: 'File too large. Maximum size is 5MB' },
          { status: 400 }
        );
      }

      // Upload to Supabase Storage
      const ext = proofFile.name.split('.').pop() || 'jpg';
      const fileName = `proof_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const arrayBuffer = await proofFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await db.storage
        .from(BUCKET)
        .upload(fileName, buffer, {
          contentType: proofFile.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json(
          { success: false, message: 'Failed to upload payment proof. Please try again.' },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(uploadData.path);
      proofUrl = urlData.publicUrl;
    }

    // Insert into database
    const { data, error } = await db.from('supa_shop_sales').insert({
      customer_name: name.trim(),
      customer_email: email.trim().toLowerCase(),
      customer_phone: phone.trim(),
      transaction_code: transactionCode.trim().toUpperCase(),
      amount,
      items: items || '',
      status: 'pending',
      payment_proof_url: proofUrl,
    }).select().single();

    if (error) {
      console.error('DB insert error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to save order. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order submitted successfully! We will confirm within 24 hours.',
      orderId: data.id,
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}

export const config = {
  api: { bodyParser: false },
};
