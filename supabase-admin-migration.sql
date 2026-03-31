-- HerrTechGPT Admin Migration
-- Run this in the Supabase SQL Editor AFTER the base schema

-- 1. Add role column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 2. Agent configs table (admins can customize agents)
CREATE TABLE IF NOT EXISTS public.agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🤖',
  system_prompt TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read agent configs
CREATE POLICY "Authenticated users can read agent configs"
  ON public.agent_configs FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify (enforced in API via service role)
-- Service role bypasses RLS, so we handle auth in API routes

-- 3. Admin can view all profiles (for user management)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 4. Admin can update all profiles (for role management)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- NOTE: The existing "Users can view own profile" policy may conflict.
-- If so, drop it first: DROP POLICY "Users can view own profile" ON public.profiles;
-- Then run this migration.
