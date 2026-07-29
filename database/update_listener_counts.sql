-- Add peak_listeners column to radio_stations
ALTER TABLE public.radio_stations 
ADD COLUMN IF NOT EXISTS peak_listeners INTEGER DEFAULT 0;

-- Function to update listener counts and peak listeners automatically
CREATE OR REPLACE FUNCTION public.update_station_listener_counts()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Calculate exact count
        SELECT count(*) INTO current_count FROM public.radio_listeners WHERE station_id = NEW.station_id;
        
        -- Update station listener_count and peak_listeners
        UPDATE public.radio_stations
        SET 
            listener_count = current_count,
            peak_listeners = GREATEST(COALESCE(peak_listeners, 0), current_count)
        WHERE station_id = NEW.station_id;
        
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Calculate exact count
        SELECT count(*) INTO current_count FROM public.radio_listeners WHERE station_id = OLD.station_id;
        
        -- Update station listener_count only
        UPDATE public.radio_stations
        SET listener_count = current_count
        WHERE station_id = OLD.station_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS trigger_update_listener_counts ON public.radio_listeners;
CREATE TRIGGER trigger_update_listener_counts
AFTER INSERT OR DELETE ON public.radio_listeners
FOR EACH ROW
EXECUTE FUNCTION public.update_station_listener_counts();

-- Recalculate existing counts to ensure consistency
UPDATE public.radio_stations s
SET listener_count = (
    SELECT count(*) 
    FROM public.radio_listeners l 
    WHERE l.station_id = s.station_id
);
