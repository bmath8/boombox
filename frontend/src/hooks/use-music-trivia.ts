'use client';

import { useState, useCallback, useEffect } from 'react';

interface Question {
    trackUrl: string; // Preview URL
    options: string[]; // 4 options
    correctAnswer: string;
}

/**
 * Hook for Music Trivia / Quiz Mode
 * 
 * Generates questions based on playlist and tracks score
 */
export function useMusicTrivia() {
    const [isActive, setIsActive] = useState(false);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [timeLeft, setTimeLeft] = useState(10);

    const startGame = useCallback(() => {
        setIsActive(true);
        setScore(0);
        nextQuestion();
    }, []);

    const nextQuestion = () => {
        // Mock question generation
        setCurrentQuestion({
            trackUrl: 'mock-audio.mp3',
            options: ['The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd'],
            correctAnswer: 'Queen',
        });
        setTimeLeft(10);
    };

    const submitAnswer = useCallback((answer: string) => {
        if (!currentQuestion) return;

        if (answer === currentQuestion.correctAnswer) {
            setScore(prev => prev + 100); // +100 points
            console.log('[Trivia] Correct!');
        } else {
            console.log('[Trivia] Wrong!');
        }

        // Next immediately for now
        nextQuestion();
    }, [currentQuestion]);

    useEffect(() => {
        if (!isActive || !currentQuestion) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    nextQuestion();
                    return 10;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive, currentQuestion]);

    const stopGame = useCallback(() => {
        setIsActive(false);
        setCurrentQuestion(null);
    }, []);

    return {
        isActive,
        score,
        currentQuestion,
        timeLeft,
        startGame,
        stopGame,
        submitAnswer,
    };
}
