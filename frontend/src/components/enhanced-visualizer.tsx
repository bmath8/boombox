'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Palette, Zap } from 'lucide-react';

type VisualizerTheme = 'neon' | 'retro' | 'minimal' | 'fire' | 'ocean' | 'rainbow';

interface EnhancedVisualizerProps {
    audioData?: Uint8Array;
    isPlaying?: boolean;
    theme?: VisualizerTheme;
    showControls?: boolean;
    visualizationStyle?: 'bars' | 'wave' | 'circular' | 'particles';
}

const THEMES: Record<VisualizerTheme, {
    colors: string[];
    background: string;
    glow: boolean;
    style: 'bars' | 'wave' | 'circular' | 'particles';
}> = {
    neon: {
        colors: ['#00ff87', '#60efff', '#ff6bc1', '#ffd93d'],
        background: 'rgba(0, 0, 0, 0.8)',
        glow: true,
        style: 'bars'
    },
    retro: {
        colors: ['#ff6b35', '#f7c59f', '#efefef'],
        background: 'rgba(26, 26, 46, 0.9)',
        glow: false,
        style: 'bars'
    },
    minimal: {
        colors: ['#ffffff', '#cccccc'],
        background: 'transparent',
        glow: false,
        style: 'wave'
    },
    fire: {
        colors: ['#ff0000', '#ff4500', '#ffa500', '#ffff00'],
        background: 'rgba(0, 0, 0, 0.7)',
        glow: true,
        style: 'bars'
    },
    ocean: {
        colors: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
        background: 'rgba(0, 30, 60, 0.8)',
        glow: true,
        style: 'wave'
    },
    rainbow: {
        colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'],
        background: 'rgba(0, 0, 0, 0.6)',
        glow: true,
        style: 'bars'
    }
};

export function EnhancedVisualizer({
    audioData,
    isPlaying = false,
    theme: initialTheme = 'neon',
    showControls = true,
    visualizationStyle
}: EnhancedVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const [theme, setTheme] = useState<VisualizerTheme>(initialTheme);
    const [showSettings, setShowSettings] = useState(false);
    const [sensitivity, setSensitivity] = useState(1);
    const [smoothing, setSmoothing] = useState(0.8);

    // Generate mock audio data if none provided
    const [mockData, setMockData] = useState<Uint8Array>(new Uint8Array(64).fill(0));

    useEffect(() => {
        if (!isPlaying) return;

        // Generate smooth mock audio data for demo
        const interval = setInterval(() => {
            setMockData(prev => {
                const newData = new Uint8Array(64);
                for (let i = 0; i < 64; i++) {
                    // Create smooth wave pattern with random variation
                    const wave = Math.sin(Date.now() / 200 + i * 0.3) * 50;
                    const random = Math.random() * 30;
                    const bass = i < 8 ? Math.random() * 80 : 0;
                    const target = Math.max(0, Math.min(255, 100 + wave + random + bass));
                    // Smooth transition
                    const prevValue = prev[i] ?? 0;
                    newData[i] = Math.floor(prevValue * smoothing + target * (1 - smoothing));
                }
                return newData;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [isPlaying, smoothing]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = audioData || mockData;
        const themeConfig = THEMES[theme];
        const style = visualizationStyle || themeConfig.style;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Apply background
            ctx.fillStyle = themeConfig.background;
            ctx.fillRect(0, 0, width, height);

            // Draw based on style
            switch (style) {
                case 'bars':
                    drawBars(ctx, data, width, height, themeConfig);
                    break;
                case 'wave':
                    drawWave(ctx, data, width, height, themeConfig);
                    break;
                case 'circular':
                    drawCircular(ctx, data, width, height, themeConfig);
                    break;
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [audioData, mockData, theme, sensitivity]);

    const drawBars = (
        ctx: CanvasRenderingContext2D,
        data: Uint8Array,
        width: number,
        height: number,
        config: typeof THEMES['neon']
    ) => {
        const barWidth = width / data.length;
        const barGap = 2;

        for (let i = 0; i < data.length; i++) {
            const dataValue = data[i] ?? 0;
            const barHeight = (dataValue / 255) * height * sensitivity;
            const x = i * barWidth;
            const y = height - barHeight;

            // Create gradient
            const gradient = ctx.createLinearGradient(x, height, x, y);
            const colorIndex = Math.floor((i / data.length) * config.colors.length);
            const color1 = config.colors[colorIndex % config.colors.length] || '#fff';
            const color2 = config.colors[(colorIndex + 1) % config.colors.length] || '#fff';
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);

            // Glow effect
            if (config.glow) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = color1;
            } else {
                ctx.shadowBlur = 0;
            }

            ctx.fillStyle = gradient;
            ctx.fillRect(x + barGap / 2, y, barWidth - barGap, barHeight);

            // Mirror effect
            ctx.globalAlpha = 0.1;
            ctx.fillRect(x + barGap / 2, height, barWidth - barGap, -barHeight * 0.3);
            ctx.globalAlpha = 1;
        }
    };

    const drawWave = (
        ctx: CanvasRenderingContext2D,
        data: Uint8Array,
        width: number,
        height: number,
        config: typeof THEMES['neon']
    ) => {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        const sliceWidth = width / data.length;
        let x = 0;

        for (let i = 0; i < data.length; i++) {
            const dataValue = data[i] ?? 0;
            const v = dataValue / 128.0;
            const y = (v * height / 2) * sensitivity;

            if (i === 0) {
                ctx.moveTo(x, height / 2 + y);
            } else {
                ctx.lineTo(x, height / 2 + y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);

        // Create gradient stroke
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        config.colors.forEach((color, i) => {
            gradient.addColorStop(i / (config.colors.length - 1), color);
        });

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;

        if (config.glow) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = config.colors[0] || '#fff';
        }

        ctx.stroke();

        // Fill under curve
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
        fillGradient.addColorStop(0, config.colors[0] + '40');
        fillGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = fillGradient;
        ctx.fill();
    };

    const drawCircular = (
        ctx: CanvasRenderingContext2D,
        data: Uint8Array,
        width: number,
        height: number,
        config: typeof THEMES['neon']
    ) => {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;

        for (let i = 0; i < data.length; i++) {
            const angle = (i / data.length) * Math.PI * 2;
            const dataValue = data[i] ?? 0;
            const amplitude = (dataValue / 255) * radius * sensitivity;

            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + amplitude);
            const y2 = centerY + Math.sin(angle) * (radius + amplitude);

            const colorIndex = Math.floor((i / data.length) * config.colors.length);
            ctx.strokeStyle = config.colors[colorIndex % config.colors.length] || '#fff';
            ctx.lineWidth = 2;

            if (config.glow) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = ctx.strokeStyle;
            }

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    };

    return (
        <div className="relative w-full h-full">
            <canvas
                ref={canvasRef}
                width={800}
                height={200}
                className="w-full h-full"
            />

            {/* Controls */}
            {showControls && (
                <div className="absolute top-2 right-2 flex gap-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                    >
                        <Settings className="w-4 h-4 text-white" />
                    </button>
                </div>
            )}

            {/* Settings Panel */}
            {showSettings && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-12 right-2 bg-black/90 backdrop-blur-lg rounded-xl border border-white/10 p-4 w-64"
                >
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Visualizer Settings
                    </h4>

                    {/* Theme Selection */}
                    <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Theme</label>
                        <div className="grid grid-cols-3 gap-1">
                            {Object.keys(THEMES).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t as VisualizerTheme)}
                                    className={`p-2 text-xs rounded transition-colors capitalize ${theme === t
                                        ? 'bg-primary text-white'
                                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sensitivity */}
                    <div className="mb-3">
                        <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            Sensitivity
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={sensitivity}
                            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>

                    {/* Smoothing */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block">
                            Smoothing
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="0.95"
                            step="0.05"
                            value={smoothing}
                            onChange={(e) => setSmoothing(parseFloat(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>
                </motion.div>
            )}
        </div>
    );
}
