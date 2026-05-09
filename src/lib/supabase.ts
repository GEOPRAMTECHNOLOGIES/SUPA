import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client (service role)
export const supabaseAdmin = () =>
  createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

export type Sale = {
  id?: string;
  created_at?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  transaction_code: string;
  amount: number;
  items: string;
  payment_proof_url?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  mpesa_checkout_id?: string;
};
