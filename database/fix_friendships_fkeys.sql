-- Fix Foreign Keys on Friendships Table
-- Explicitly name the constraints so Supabase can find them

-- 1. Drop existing constraints (we try multiple possible names)
DO $$
BEGIN
    -- Try to drop user_id FK if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'friendships_user_id_fkey') THEN
        ALTER TABLE public.friendships DROP CONSTRAINT friendships_user_id_fkey;
    END IF;
    
    -- Try to drop friend_id FK if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'friendships_friend_id_fkey') THEN
        ALTER TABLE public.friendships DROP CONSTRAINT friendships_friend_id_fkey;
    END IF;
    
    -- Also try generic names just in case
    -- (We can't easily guess random names, but we can try to recreate them)
END $$;

-- 2. Re-add constraints with EXPLICIT names
ALTER TABLE public.friendships
    ADD CONSTRAINT friendships_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(user_id) 
    ON DELETE CASCADE;

ALTER TABLE public.friendships
    ADD CONSTRAINT friendships_friend_id_fkey 
    FOREIGN KEY (friend_id) 
    REFERENCES public.users(user_id) 
    ON DELETE CASCADE;

-- 3. Verify
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'friendships' 
AND constraint_type = 'FOREIGN KEY';
