import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password required' }, { status: 400 });
    }

    const valid = verifyAdminCredentials(email.trim(), password);
    if (!valid) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: 'Authenticated' });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
