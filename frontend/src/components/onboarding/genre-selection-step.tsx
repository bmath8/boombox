'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music2 } from 'lucide-react';

interface GenreSelectionStepProps {
    onNext: () => void;
    onSkip?: () => void;
}

const GENRES = [
    { id: 'pop', name: 'Pop', emoji: '🎵' },
    { id: 'rock', name: 'Rock', emoji: '🎸' },
    { id: 'hip-hop', name: 'Hip Hop', emoji: '🎤' },
    { id: 'electronic', name: 'Electronic', emoji: '🎧' },
    { id: 'jazz', name: 'Jazz', emoji: '🎷' },
    { id: 'classical', name: 'Classical', emoji: '🎻' },
    { id: 'indie', name: 'Indie', emoji: '🎹' },
    { id: 'r-and-b', name: 'R&B', emoji: '🎶' },
    { id: 'country', name: 'Country', emoji: '🤠' },
    { id: 'latin', name: 'Latin', emoji: '💃' },
    { id: 'metal', name: 'Metal', emoji: '🤘' },
    { id: 'folk', name: 'Folk', emoji: '🪕' },
];

export function GenreSelectionStep({ onNext, onSkip }: GenreSelectionStepProps) {
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

    const toggleGenre = (genreId: string) => {
        setSelectedGenres((prev) =>
            prev.includes(genreId)
                ? prev.filter((id) => id !== genreId)
                : [...prev, genreId]
        );
    };

    const handleContinue = () => {
        // Save selected genres
        onNext();
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                        <Music2 className="h-10 w-10 text-primary" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold">What Do You Like to Listen To?</h2>
                <p className="text-muted-foreground">
                    Select at least 3 genres to help us personalize your experience
                </p>
            </div>

            <Card className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {GENRES.map((genre) => {
                        const isSelected = selectedGenres.includes(genre.id);
                        return (
                            <button
                                key={genre.id}
                                onClick={() => toggleGenre(genre.id)}
                                className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                                    isSelected
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:border-primary/50'
                                }`}
                            >
                                <div className="text-3xl mb-2">{genre.emoji}</div>
                                <div className="font-medium">{genre.name}</div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div>
                        <Badge variant={selectedGenres.length >= 3 ? 'default' : 'secondary'}>
                            {selectedGenres.length} selected
                        </Badge>
                    </div>
                    <div className="flex gap-3">
                        {onSkip && (
                            <Button variant="ghost" onClick={onSkip}>
                                Skip
                            </Button>
                        )}
                        <Button
                            onClick={handleContinue}
                            disabled={selectedGenres.length < 3}
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
