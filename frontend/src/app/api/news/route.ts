
import { NextResponse } from 'next/server';

/**
 * Music News API
 * 
 * Fetches latest music news from NewsAPI or RSS feeds.
 * Falls back to demo data if keys are missing.
 */

const NEWS_API_KEY = process.env['NEWS_API_KEY']; // e.g., newsapi.org
const NEWS_ENDPOINT = 'https://newsapi.org/v2/everything';

export async function GET(request: Request) {
    try {
        // 1. Check for API Key
        if (!NEWS_API_KEY) {
            console.warn('[API] News: No NEWS_API_KEY found. Serving demo data.');
            return NextResponse.json(getDemoNews());
        }

        // 2. Real API Call (Example: NewsAPI)
        const queryParams = new URLSearchParams({
            apiKey: NEWS_API_KEY,
            q: 'music AND (concert OR album OR artist)',
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: '10'
        });

        const response = await fetch(`${NEWS_ENDPOINT}?${queryParams}`);

        if (!response.ok) {
            throw new Error(`News API error: ${response.statusText}`);
        }

        const data = await response.json();
        const news = data.articles?.map(mapNewsArticle) || [];

        return NextResponse.json(news);

    } catch (error) {
        console.error('[API] News Error:', error);
        return NextResponse.json(getDemoNews());
    }
}

// --- Helpers ---

function mapNewsArticle(article: any) {
    return {
        id: article.url, // Use URL as ID
        title: article.title,
        summary: article.description,
        source: article.source?.name,
        url: article.url,
        imageUrl: article.urlToImage,
        publishedAt: article.publishedAt,
        relatedArtists: [] // Complex to extract without NLP
    };
}

function getDemoNews() {
    return [
        {
            id: 'news-demo-1',
            title: 'Daft Punk Returns? Rumors Swirl Around New Studio Sessions',
            summary: 'Industry insiders report seeing the legendary duo at Electric Lady Studios.',
            source: 'SynthDaily',
            url: '#',
            imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
            publishedAt: new Date().toISOString(),
            relatedArtists: ['Daft Punk'],
            isDemo: true
        },
        {
            id: 'news-demo-2',
            title: 'Top 10 Synthesizers of 2025 Reviewed',
            summary: 'We rank the year\'s best hardware for bedroom producers and pros alike.',
            source: 'TechMusic',
            url: '#',
            imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
            publishedAt: new Date(Date.now() - 86400000).toISOString(),
            relatedArtists: [],
            isDemo: true
        },
        {
            id: 'news-demo-3',
            title: 'Spotify Announces Hi-Fi Tier Launch Date',
            summary: 'Lossless audio streaming is finally coming to the platform this winter.',
            source: 'AudioVerge',
            url: '#',
            imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80',
            publishedAt: new Date(Date.now() - 172800000).toISOString(),
            relatedArtists: [],
            isDemo: true
        }
    ];
}
