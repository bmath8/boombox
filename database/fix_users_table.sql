-- Quick Fix: Add Missing Columns to Existing Users Table
-- Run this BEFORE the master migration if you get column errors

-- Add missing columns to users table
DO $$ 
BEGIN
    -- Add last_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'last_active') THEN
        ALTER TABLE public.users ADD COLUMN last_active TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added last_active column to users table';
    ELSE
        RAISE NOTICE 'last_active column already exists';
    END IF;
    
    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'is_active') THEN
        ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to users table';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;
    
    -- Add settings column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'settings') THEN
        ALTER TABLE public.users ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added settings column to users table';
    ELSE
        RAISE NOTICE 'settings column already exists';
    END IF;
    
    -- Add country column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'country') THEN
        ALTER TABLE public.users ADD COLUMN country VARCHAR(2);
        RAISE NOTICE 'Added country column to users table';
    ELSE
        RAISE NOTICE 'country column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;
