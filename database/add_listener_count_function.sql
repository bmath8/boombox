-- Add helper function to increment listener count
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION increment_listener_count(station_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE radio_stations
    SET listener_count = (
        SELECT COUNT(DISTINCT user_id)
        FROM radio_listeners
        WHERE radio_listeners.station_id = increment_listener_count.station_id
          AND last_heartbeat > NOW() - INTERVAL '2 minutes'
    )
    WHERE radio_stations.station_id = increment_listener_count.station_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
