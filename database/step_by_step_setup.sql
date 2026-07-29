-- Super Simple Setup - Run each section one at a time if needed
-- Part 1: Create users table
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW()
);

-- Part 2: Create radio_stations table
CREATE TABLE IF NOT EXISTS public.radio_stations (
    station_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcaster_id UUID NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'offline',
    listener_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    went_live_at TIMESTAMP
);

-- Part 3: Add foreign key constraint
ALTER TABLE public.radio_stations 
DROP CONSTRAINT IF EXISTS radio_stations_broadcaster_id_fkey;

ALTER TABLE public.radio_stations 
ADD CONSTRAINT radio_stations_broadcaster_id_fkey 
FOREIGN KEY (broadcaster_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Part 4: Enable RLS and create policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for users" ON public.users;
CREATE POLICY "Allow all for users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for radio_stations" ON public.radio_stations;
CREATE POLICY "Allow all for radio_stations" ON public.radio_stations FOR ALL USING (true) WITH CHECK (true);

-- Part 5: Create function to sync auth.users with public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (user_id, email, display_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part 6: Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Part 7: Backfill existing auth users into public.users
INSERT INTO public.users (user_id, email, display_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
