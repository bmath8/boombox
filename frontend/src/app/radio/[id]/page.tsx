'use client';

import { useParams } from 'next/navigation';
import { VinylBroadcast } from '@/components/vinyl-broadcast';

export default function StationPage() {
    const params = useParams();
    const stationId = params['id'] as string;

    if (!stationId) return null;

    return <VinylBroadcast stationId={stationId} />;
}
