-- Test the find_discovery_matches function
-- Run this in Supabase SQL Editor to see if it works

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get a valid user ID (e.g., the Spotify user)
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    -- Call the function
    PERFORM public.find_discovery_matches(v_user_id);
    
    RAISE NOTICE 'Function called successfully for user %', v_user_id;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error calling function: %', SQLERRM;
END $$;

-- Also check the function definition
-- End of script
