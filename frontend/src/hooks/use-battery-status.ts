'use client';

import { useState, useEffect } from 'react';

interface BatteryState {
    level: number; // 0 to 1
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    lowPowerMode: boolean;
}

/**
 * Hook for battery status monitoring
 * 
 * Used for power-aware feature adaptation (e.g. disabling heavy animations)
 */
export function useBatteryStatus() {
    const [battery, setBattery] = useState<BatteryState>({
        level: 1,
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        lowPowerMode: false,
    });

    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
            setIsSupported(true);
            (navigator as any).getBattery().then((batt: any) => {
                const updateBattery = () => {
                    const lowPower = batt.level < 0.2 && !batt.charging;
                    setBattery({
                        level: batt.level,
                        charging: batt.charging,
                        chargingTime: batt.chargingTime,
                        dischargingTime: batt.dischargingTime,
                        lowPowerMode: lowPower,
                    });
                };

                updateBattery();

                batt.addEventListener('levelchange', updateBattery);
                batt.addEventListener('chargingchange', updateBattery);
                batt.addEventListener('chargingtimechange', updateBattery);
                batt.addEventListener('dischargingtimechange', updateBattery);

                return () => {
                    batt.removeEventListener('levelchange', updateBattery);
                    batt.removeEventListener('chargingchange', updateBattery);
                    batt.removeEventListener('chargingtimechange', updateBattery);
                    batt.removeEventListener('dischargingtimechange', updateBattery);
                };
            });
        } else {
            setIsSupported(false);
        }
    }, []);

    return {
        battery,
        isSupported,
    };
}
