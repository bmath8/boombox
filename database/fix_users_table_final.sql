-- Fix: Remove hashed_password constraint or make it nullable
-- The public.users table should sync with auth.users, which doesn't expose passwords

-- Option 1: Make hashed_password nullable (RECOMMENDED)
ALTER TABLE public.users 
ALTER COLUMN hashed_password DROP NOT NULL;

-- Option 2: Drop the column entirely if not used (alternative)
-- ALTER TABLE public.users DROP COLUMN IF EXISTS hashed_password;

-- Now sync users from auth.users to public.users
INSERT INTO public.users (user_id, email, display_name)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1))
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM public.users)
ON CONFLICT (user_id) DO UPDATE
SET 
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name);

-- Initialize curator_stats for all users
INSERT INTO public.curator_stats (user_id)
SELECT user_id FROM public.users
WHERE user_id NOT IN (SELECT user_id FROM public.curator_stats)
ON CONFLICT (user_id) DO NOTHING;

-- Initialize dj_stats for all users
INSERT INTO public.dj_stats (user_id)
SELECT user_id FROM public.users
WHERE user_id NOT IN (SELECT user_id FROM public.dj_stats)
ON CONFLICT (user_id) DO NOTHING;

-- Create trigger to auto-sync new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into public.users
    INSERT INTO public.users (user_id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
    )
    ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email;
    
    -- Initialize curator_stats
    INSERT INTO public.curator_stats (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Initialize dj_stats
    INSERT INTO public.dj_stats (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Verify sync
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users,
    (SELECT COUNT(*) FROM public.users) as public_users,
    (SELECT COUNT(*) FROM public.curator_stats) as curator_stats,
    (SELECT COUNT(*) FROM public.dj_stats) as dj_stats;
