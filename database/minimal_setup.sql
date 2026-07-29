-- Minimal FAM Music V.2 Setup
-- Run this in Supabase SQL Editor

-- Step 1: Create users table (synced with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create radio_stations table
CREATE TABLE IF NOT EXISTS public.radio_stations (
    station_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcaster_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    station_name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'offline',
    listener_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    went_live_at TIMESTAMP
);

-- Step 3: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_stations ENABLE ROW LEVEL SECURITY;

-- Step 4: Create permissive policies for development
DROP POLICY IF EXISTS "Allow all for users" ON public.users;
CREATE POLICY "Allow all for users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for radio_stations" ON public.radio_stations;
CREATE POLICY "Allow all for radio_stations" ON public.radio_stations FOR ALL USING (true) WITH CHECK (true);

-- Step 5: Create trigger to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (user_id, email, display_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Backfill existing users
INSERT INTO public.users (user_id, email, display_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
