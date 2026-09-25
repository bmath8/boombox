# 🗺️ BOOMBOX APP - COMPLETE ROADMAP

## Your Path from Good to Great

---

## 🎯 **EXECUTIVE SUMMARY**

**Current Status:** ✅ Core functionality working, security hardened, performance optimized

**What's Left:**
- 5 critical security features
- 12 core user features
- 8 advanced features
- UI/UX polish

**Timeline:** 12-16 weeks to production-ready MVP
**Team Size:** 2-3 developers
**Estimated Cost:** $80k-$120k (if hiring)

---

## 📅 **12-WEEK IMPLEMENTATION PLAN**

### **WEEK 1-2: Security Foundation**

#### 1. Content Security Policy (CSP) Headers
**Priority:** CRITICAL
**Effort:** 8 hours
**Files:**
- `frontend/src/middleware.ts`
- `frontend/next.config.js`

**Implementation:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // CSP Headers
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.scdn.co",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "connect-src 'self' wss: https://api.spotify.com",
            "font-src 'self' data:",
            "media-src 'self' https:",
        ].join('; ')
    );

    // Other security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
}
```

**Testing:**
```bash
curl -I https://your-app.com | grep -i "content-security"
```

---

#### 2. Session Management Dashboard
**Priority:** HIGH
**Effort:** 16 hours

**Features:**
- View all active sessions
- Remote session termination
- Session history
- Device fingerprinting

**Files to Create:**
```
frontend/src/app/settings/sessions/page.tsx
frontend/src/components/session-list.tsx
frontend/src/app/api/sessions/revoke/route.ts
```

**Database:**
```sql
CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    device_info JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);
```

---

#### 3. Account Deletion (GDPR Compliance)
**Priority:** HIGH (Legal requirement in EU)
**Effort:** 12 hours

**Implementation:**
```typescript
// frontend/src/app/api/account/delete/route.ts
export async function POST(request: NextRequest) {
    // 1. Verify user identity
    // 2. Create deletion request
    // 3. Schedule data removal (7-day grace period)
    // 4. Send confirmation email
    // 5. Log audit trail
}
```

**Database:**
```sql
-- Cascade deletes properly configured
ALTER TABLE listening_activity
ADD CONSTRAINT fk_user_cascade
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
```

---

### **WEEK 3-4: User Experience Core**

#### 4. Dark/Light Mode Toggle
**Priority:** HIGH
**Effort:** 12 hours

**Implementation:**
```typescript
// frontend/src/contexts/theme-context.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
    theme: Theme;
    setTheme: (theme: Theme) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('system');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('theme') as Theme;
        if (stored) setTheme(stored);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }

        localStorage.setItem('theme', theme);
    }, [theme, mounted]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
```

**CSS:**
```css
/* globals.css */
:root {
    --background: #ffffff;
    --foreground: #000000;
    /* ... other light mode colors */
}

.dark {
    --background: #000000;
    --foreground: #ffffff;
    /* ... other dark mode colors */
}
```

---

#### 5. User Blocking System
**Priority:** HIGH
**Effort:** 20 hours

**Database:**
```sql
CREATE TABLE user_blocks (
    block_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    reason VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

CREATE INDEX idx_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON user_blocks(blocked_id);
```

**API Routes:**
```typescript
// POST /api/users/block
// DELETE /api/users/unblock/:userId
// GET /api/users/blocked
```

**Middleware Integration:**
```typescript
// Filter blocked users from:
// - Search results
// - Friend suggestions
// - Radio listeners
// - Chat messages
// - Shared playlists
```

---

#### 6. Push Notifications (Real Implementation)
**Priority:** MEDIUM
**Effort:** 24 hours

**Service Worker:**
```javascript
// public/sw.js
self.addEventListener('push', function(event) {
    const data = event.data.json();

    const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: { url: data.url }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
```

**Backend:**
```typescript
// backend/services/push-notifications.js
const webpush = require('web-push');

webpush.setVapidDetails(
    'mailto:your-email@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

async function sendNotification(subscription, payload) {
    return await webpush.sendNotification(subscription, JSON.stringify(payload));
}
```

---

### **WEEK 5-6: Social Features**

#### 7. User Profiles
**Priority:** HIGH
**Effort:** 32 hours

**Features:**
- Public profile page
- Edit profile
- Profile picture upload
- Bio and links
- Listening stats
- Badge system

**Files:**
```
frontend/src/app/profile/[userId]/page.tsx
frontend/src/components/profile/profile-header.tsx
frontend/src/components/profile/listening-stats.tsx
frontend/src/components/profile/badges.tsx
frontend/src/app/api/profile/update/route.ts
```

---

#### 8. Following System
**Priority:** MEDIUM
**Effort:** 24 hours

**Database:**
```sql
CREATE TABLE follows (
    follow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

**Features:**
- Follow/unfollow users
- Followers list
- Following list
- Follow notifications
- Follower count

---

#### 9. Activity Feed
**Priority:** MEDIUM
**Effort:** 28 hours

**Features:**
- Real-time friend activity
- "Now Playing" status
- New playlist shares
- Likes and comments
- Infinite scroll

**WebSocket Events:**
```typescript
// New event types
type ActivityEvent =
    | { type: 'friend:now_playing', userId: string, track: Track }
    | { type: 'friend:new_playlist', userId: string, playlist: Playlist }
    | { type: 'friend:liked_track', userId: string, track: Track };
```

---

### **WEEK 7-8: Radio & Broadcasting**

#### 10. Stream Quality Selection
**Priority:** MEDIUM
**Effort:** 16 hours

**Implementation:**
```typescript
type StreamQuality = 'low' | 'medium' | 'high' | 'auto';

const QUALITY_SETTINGS = {
    low: { bitrate: 96, sampleRate: 22050 },
    medium: { bitrate: 128, sampleRate: 44100 },
    high: { bitrate: 320, sampleRate: 48000 },
};
```

---

#### 11. Moderation Tools
**Priority:** HIGH
**Effort:** 20 hours

**Features:**
- Mute listener (chat only)
- Kick listener (remove from station)
- Ban listener (permanent)
- Timeout (temporary ban)
- Mod role assignment

**Database:**
```sql
CREATE TABLE station_moderators (
    moderator_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES radio_stations(station_id),
    user_id UUID REFERENCES users(user_id),
    permissions JSONB,
    assigned_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE station_bans (
    ban_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES radio_stations(station_id),
    user_id UUID REFERENCES users(user_id),
    banned_by UUID REFERENCES users(user_id),
    reason VARCHAR(500),
    duration_minutes INTEGER, -- NULL = permanent
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **WEEK 9-10: Advanced Features**

#### 12. AI Music Recommendations
**Priority:** HIGH
**Effort:** 40 hours

**Approach:**
```typescript
// Use Spotify's recommendation API + collaborative filtering

async function getPersonalizedRecommendations(userId: string) {
    // 1. Get user's top tracks/artists (last 30 days)
    const topTracks = await getTopTracks(userId, '30day');

    // 2. Get seed tracks (up to 5)
    const seeds = topTracks.slice(0, 5).map(t => t.id);

    // 3. Call Spotify recommendations
    const recommended = await spotify.getRecommendations({
        seed_tracks: seeds,
        target_energy: getUserEnergyPreference(userId),
        target_valence: getUserMoodPreference(userId),
        limit: 20
    });

    // 4. Filter out already listened
    // 5. Apply collaborative filtering
    // 6. Return personalized list
}
```

**Libraries:**
- TensorFlow.js (for collaborative filtering)
- Spotify Web API (for seed data)
- Custom recommendation engine

---

#### 13. Live Lyrics Sync
**Priority:** MEDIUM
**Effort:** 24 hours

**API Options:**
1. **Musixmatch API** (Recommended)
   - Synced lyrics available
   - 2000 free requests/day
   - $10/month for more

2. **Genius API**
   - Lyrics available but not synced
   - Free tier available

**Implementation:**
```typescript
interface LyricLine {
    time: number; // milliseconds
    text: string;
}

async function getSyncedLyrics(trackId: string): Promise<LyricLine[]> {
    // 1. Call Musixmatch API
    // 2. Parse synced lyrics format
    // 3. Return time-stamped lines
}

// In Player component
useEffect(() => {
    const interval = setInterval(() => {
        const currentTime = player.getCurrentTime();
        const currentLine = lyrics.find(l =>
            l.time <= currentTime &&
            lyrics[lyrics.indexOf(l) + 1]?.time > currentTime
        );
        setActiveLine(currentLine);
    }, 100);

    return () => clearInterval(interval);
}, [player, lyrics]);
```

---

#### 14. Collaborative Listening Rooms
**Priority:** HIGH
**Effort:** 48 hours

**Features:**
- Synchronized playback
- Queue voting
- Real-time chat
- Invite system
- Room controls

**WebSocket Protocol:**
```typescript
type RoomEvent =
    | { type: 'room:sync', position: number, playing: boolean }
    | { type: 'room:queue_add', track: Track, userId: string }
    | { type: 'room:queue_vote', trackId: string, vote: 1 | -1 }
    | { type: 'room:skip', skipCount: number, required: number };
```

**Synchronization:**
```typescript
// Every 5 seconds, broadcaster sends sync event
setInterval(() => {
    broadcastToRoom({
        type: 'room:sync',
        position: player.getCurrentTime(),
        playing: !player.isPaused()
    });
}, 5000);

// Listeners sync their playback
onRoomSync((data) => {
    const drift = Math.abs(player.getCurrentTime() - data.position);

    if (drift > 1000) { // 1 second drift
        player.seek(data.position);
    }

    if (data.playing && player.isPaused()) {
        player.play();
    }
});
```

---

### **WEEK 11-12: Polish & Testing**

#### 15. Comprehensive Testing
**Effort:** 40 hours

**Test Coverage Goals:**
- Unit tests: 80%
- Integration tests: 60%
- E2E tests: Critical paths only

**Testing Stack:**
```json
{
    "unit": "Jest + React Testing Library",
    "integration": "Supertest + Jest",
    "e2e": "Playwright",
    "performance": "Lighthouse CI"
}
```

---

#### 16. Documentation
**Effort:** 24 hours

**Documents to Create:**
1. API Documentation (OpenAPI/Swagger)
2. User Guide
3. Admin Guide
4. Contributing Guide
5. Deployment Guide

---

#### 17. Performance Optimization
**Effort:** 32 hours

**Optimizations:**
- Image optimization (Next.js Image)
- Code splitting
- Bundle analysis
- Lazy loading
- CDN setup
- Database query optimization

---

## 💰 **BUDGET BREAKDOWN**

### Development Costs

| Phase | Hours | Rate ($150/hr) | Total |
|-------|-------|----------------|-------|
| Weeks 1-2 (Security) | 80 | $150 | $12,000 |
| Weeks 3-4 (UX) | 96 | $150 | $14,400 |
| Weeks 5-6 (Social) | 112 | $150 | $16,800 |
| Weeks 7-8 (Radio) | 80 | $150 | $12,000 |
| Weeks 9-10 (Advanced) | 112 | $150 | $16,800 |
| Weeks 11-12 (Polish) | 96 | $150 | $14,400 |
| **TOTAL** | **576 hours** | | **$86,400** |

### Infrastructure Costs (Annual)

| Service | Monthly | Annual |
|---------|---------|--------|
| Supabase Pro | $25 | $300 |
| Vercel Pro | $20 | $240 |
| Redis Cloud | $10 | $120 |
| CDN (Cloudflare) | $0 | $0 |
| Domain | $1 | $12 |
| Monitoring (Sentry) | $26 | $312 |
| **TOTAL** | **$82/mo** | **$984/year** |

---

## 📊 **SUCCESS METRICS**

### Launch Criteria

- [ ] Zero critical security vulnerabilities
- [ ] 90% test coverage on critical paths
- [ ] < 2s page load time (P95)
- [ ] 99.9% uptime (last 30 days)
- [ ] Mobile responsive (all screens)
- [ ] WCAG 2.1 AA compliant

### Business Metrics

**Month 1 Goals:**
- 100 active users
- 500 songs played
- 10 live radio sessions
- < 5% churn rate

**Month 3 Goals:**
- 1,000 active users
- 10,000 songs played
- 100 live radio sessions
- < 3% churn rate

**Month 6 Goals:**
- 10,000 active users
- 250,000 songs played
- 1,000 live radio sessions
- Revenue: $1,000 MRR

---

## 🎓 **LEARNING RESOURCES**

### Recommended Reading

1. **Security:**
   - OWASP Top 10
   - OAuth 2.0 Specification
   - Web Security Academy

2. **Performance:**
   - "High Performance Browser Networking"
   - Web.dev Performance Guide
   - PostgreSQL Performance Tuning

3. **Architecture:**
   - "Designing Data-Intensive Applications"
   - "System Design Interview"
   - Next.js Documentation

---

## 🔄 **AGILE WORKFLOW**

### Sprint Structure (2-week sprints)

**Sprint 1-2:** Security Foundation
**Sprint 3-4:** User Experience
**Sprint 5-6:** Social Features
**Sprint 7-8:** Radio Features
**Sprint 9-10:** Advanced Features
**Sprint 11-12:** Polish & Launch

### Daily Standup Format

1. What did you complete yesterday?
2. What are you working on today?
3. Any blockers?
4. Any security concerns?

### Code Review Checklist

- [ ] Tests pass
- [ ] No security vulnerabilities
- [ ] No console.errors
- [ ] Documentation updated
- [ ] Performance impact assessed
- [ ] Accessibility verified

---

## 🚀 **GO-TO-MARKET STRATEGY**

### Pre-Launch (Weeks 1-8)

1. Build landing page
2. Create demo video
3. Beta testing program
4. Social media presence
5. Email list building

### Launch (Week 12)

1. Product Hunt launch
2. Reddit (r/indiedev, r/webdev)
3. Twitter announcement
4. Email blast to beta users
5. Press release

### Post-Launch (Weeks 13+)

1. User feedback collection
2. Analytics review
3. Performance monitoring
4. Feature prioritization
5. Growth experiments

---

## 📞 **GETTING HELP**

### When You're Stuck

1. **Check Documentation:** Start with official docs
2. **Search GitHub Issues:** Someone may have had the same problem
3. **Ask AI:** Claude, ChatGPT can help debug
4. **Community:** Discord, Stack Overflow
5. **Hire Expert:** For critical issues

### Support Resources

- Next.js Discord
- Supabase Discord
- PostgreSQL Slack
- Web Performance Slack

---

**You've got this! Your app has an incredible foundation. Execute this roadmap, and you'll have a production-ready, market-leading music social platform. 🎵**

---

*Last Updated: January 2025*
*Next Review: Every 2 weeks*
*Maintained by: FAM Music Team*
