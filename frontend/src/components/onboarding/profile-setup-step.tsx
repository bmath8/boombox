'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Upload } from 'lucide-react';

interface ProfileSetupStepProps {
    onNext: () => void;
    onSkip?: () => void;
}

export function ProfileSetupStep({ onNext, onSkip }: ProfileSetupStepProps) {
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    const handleSubmit = () => {
        // Save profile data
        onNext();
    };

    const canContinue = displayName.trim().length > 0;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Set Up Your Profile</h2>
                <p className="text-muted-foreground">
                    Let others know who you are and what music you love
                </p>
            </div>

            <Card className="p-8">
                <div className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback>
                                <User className="h-12 w-12" />
                            </AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Photo
                        </Button>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2">
                        <Label htmlFor="displayName">
                            Display Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="displayName"
                            placeholder="Enter your display name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            placeholder="Tell us about your music taste..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                            {bio.length}/150 characters
                        </p>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            placeholder="City, Country"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={!canContinue}
                            className="flex-1"
                        >
                            Continue
                        </Button>
                        {onSkip && (
                            <Button variant="ghost" onClick={onSkip}>
                                Skip
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
