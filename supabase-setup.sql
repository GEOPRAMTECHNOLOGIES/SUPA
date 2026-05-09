-- ============================================================
-- GreenMart Supabase Setup Script
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create the main sales table
CREATE TABLE IF NOT EXISTS public.supa_shop_sales (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Customer details
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,

  -- Transaction
  transaction_code TEXT DEFAULT '',
  amount           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  items            TEXT DEFAULT '',

  -- Payment
  payment_proof_url TEXT,
  mpesa_checkout_id TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'rejected'))
);

-- 2. Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.supa_shop_sales;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.supa_shop_sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_email   ON public.supa_shop_sales (customer_email);
CREATE INDEX IF NOT EXISTS idx_sales_status  ON public.supa_shop_sales (status);
CREATE INDEX IF NOT EXISTS idx_sales_created ON public.supa_shop_sales (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_mpesa   ON public.supa_shop_sales (mpesa_checkout_id);

-- 4. Row Level Security
ALTER TABLE public.supa_shop_sales ENABLE ROW LEVEL SECURITY;

-- Allow service role (backend) full access
CREATE POLICY "service_role_all" ON public.supa_shop_sales
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anon to insert (storefront)
CREATE POLICY "anon_insert" ON public.supa_shop_sales
  FOR INSERT WITH CHECK (true);

-- 5. Storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to payment-proofs bucket
CREATE POLICY "public_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs');

-- ============================================================
-- Done! Your GreenMart database is ready.
-- ============================================================
