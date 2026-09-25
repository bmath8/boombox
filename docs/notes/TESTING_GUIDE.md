# FAM Music V.3 - Testing Guide

## 📋 Overview

This guide provides comprehensive testing instructions for all features implemented across Sprints 1-4.

**Total Features to Test**: 21 major implementations
**Testing Time Estimate**: 2-3 hours for full coverage

---

## 🧪 Sprint 1: Quick Wins (10 Items)

### ✅ 1. Loading Skeletons & Empty States
**Test**: Navigate to various pages before data loads
- [ ] Visit dashboard - should show station card skeletons
- [ ] Visit profile page - should show profile skeleton
- [ ] Check empty playlist - should show helpful empty state
- [ ] Check notifications when none exist - should show empty state

**Expected**: Smooth loading experience, no blank screens

---

### ✅ 2. Search Functionality
**Test**: Use the global search
- [ ] Press `/` key - should focus search input
- [ ] Type "indie rock" - should show results
- [ ] Search for stations - should filter correctly
- [ ] Search for users - should show user profiles
- [ ] Clear search - results should clear

**Expected**: Fast, responsive search with keyboard support

---

### ✅ 3. Keyboard Shortcuts
**Test**: Try all keyboard shortcuts
- [ ] Press `?` (Shift+/) - should show shortcuts help
- [ ] Press `Space` - should play/pause (on player)
- [ ] Press `→` - should skip to next track
- [ ] Press `←` - should go to previous track
- [ ] Press `↑`/`↓` - should adjust volume
- [ ] Press `M` - should mute/unmute
- [ ] Press `/` - should focus search
- [ ] Press `Escape` - should close modals

**Expected**: All shortcuts work without conflicts

---

### ✅ 4. Mobile Responsive Design
**Test**: Resize browser or use mobile device
- [ ] Resize to mobile width (< 768px)
- [ ] Check bottom navigation appears
- [ ] Tap targets are min 44x44px
- [ ] Text is readable without zooming
- [ ] Player adapts to mobile layout
- [ ] Cards stack vertically
- [ ] Modals are full-screen on mobile

**Expected**: Fully functional on all screen sizes

**Test Devices**:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

---

### ✅ 5. PWA Basics
**Test**: Install as PWA
- [ ] Visit site in Chrome/Edge
- [ ] Look for "Install" button in address bar
- [ ] Click install
- [ ] App opens in standalone mode
- [ ] Icon appears in app list
- [ ] Works without browser chrome

**Files to Check**:
- [ ] `/manifest.json` exists
- [ ] Service worker registered
- [ ] Icons are present

**Expected**: Can install and run as standalone app

---

### ✅ 6. Error Boundaries
**Test**: Trigger errors (developer testing)
- [ ] Throw error in component
- [ ] Error boundary catches it
- [ ] Fallback UI shows
- [ ] Rest of app still works
- [ ] Error logged to console

**Expected**: Graceful error handling, no white screens

---

### ✅ 7. Toast Notifications
**Test**: Perform actions that show toasts
- [ ] Follow a user - should show success toast
- [ ] Create playlist - should show success toast
- [ ] Delete item - should show toast with undo button
- [ ] API error - should show error toast
- [ ] Multiple toasts stack properly

**Expected**: Clear feedback for all actions

---

### ✅ 8. Dark Mode
**Test**: Toggle theme
- [ ] Find theme toggle button
- [ ] Switch to dark mode - all colors invert
- [ ] Text remains readable (contrast check)
- [ ] Refresh page - theme persists
- [ ] Check system preference detection

**Expected**: Smooth theme switching with persistence

---

### ✅ 9. Profile Avatars
**Test**: User profile images
- [ ] View user profile with avatar
- [ ] View user without avatar - shows fallback
- [ ] Upload new avatar (if implemented)
- [ ] Avatar appears in all locations (nav, cards, etc.)

**Expected**: Consistent avatar display

---

### ✅ 10. Activity Indicators
**Test**: Real-time indicators
- [ ] Join active station - see live indicator
- [ ] View broadcasting user - see indicator
- [ ] Check listener count updates
- [ ] Verify timestamp updates

**Expected**: Clear indication of live activity

---

## 🧪 Sprint 2: State & Data Management (4 Items)

### ✅ 1. Zustand Store
**Test**: State management
- [ ] Open React DevTools
- [ ] Find Zustand devtools (if installed)
- [ ] Perform action (e.g., join station)
- [ ] Check state updates in devtools
- [ ] Refresh page - persisted state restored

**Stores to Test**:
- RadioStore (station state)
- UserStore (auth state)
- UIStore (theme, modals)
- SocialStore (following/followers)
- NotificationStore (notifications)
- OnboardingStore (onboarding progress)

**Expected**: Smooth state updates, persistence works

---

### ✅ 2. React Query
**Test**: Data fetching & caching
- [ ] Open React Query DevTools (bottom right)
- [ ] Navigate to stations page
- [ ] Check query status in devtools
- [ ] Verify data is cached
- [ ] Navigate away and back - uses cache
- [ ] Wait for stale time - refetches automatically
- [ ] Check background refetch on window focus

**Queries to Test**:
- Stations list
- User profile
- Notifications
- Analytics data

**Expected**: Smart caching, automatic refetching

---

### ✅ 3. API Abstraction Layer
**Test**: API calls (developer testing)
- [ ] Open Network tab in DevTools
- [ ] Perform actions that call API
- [ ] Verify requests go to `/api/*`
- [ ] Check error handling (simulate 500 error)
- [ ] Verify consistent error messages

**API Services to Test**:
```typescript
import { api } from '@/lib/api';

// Should work
await api.search.search('indie');
await api.profile.getProfile(userId);
await api.notifications.getNotifications();
await api.analytics.getSummary();
```

**Expected**: Consistent API interface, good error handling

---

### ✅ 4. Feature Flags
**Test**: Toggle features
- [ ] Open browser console
- [ ] Type `window.__FEATURE_FLAGS__.list()`
- [ ] Check available flags
- [ ] Enable a flag: `window.__FEATURE_FLAGS__.enable('newPlayer')`
- [ ] Refresh page - flag persists (if configured)
- [ ] Feature appears/disappears based on flag

**Flags to Test**:
- newPlayer
- aiRecommendations
- enhancedVisualizer
- darkMode

**Expected**: Easy feature toggling without code changes

---

## 🧪 Sprint 3: Core Features (3 Items)

### ✅ 1. User Profiles & Social Graph

#### Profile Page
**Test**: View and edit profile
- [ ] Navigate to `/profile/[userId]`
- [ ] See profile header (avatar, cover photo)
- [ ] View bio, location, genres
- [ ] Check stats (followers, following, playlists)
- [ ] View badges section
- [ ] Switch between tabs (Activity, Stats, Followers, Following)

#### Follow System
**Test**: Social interactions
- [ ] Follow a user - count increments
- [ ] Unfollow a user - count decrements
- [ ] View followers list - shows all followers
- [ ] View following list - shows who you follow
- [ ] Check mutual followers indicator

#### Activity Feed
**Test**: Real-time activity
- [ ] View activity feed on profile
- [ ] See recent actions (created station, followed user, etc.)
- [ ] Check timestamps are relative ("2 hours ago")
- [ ] Click activity item - navigates to relevant page
- [ ] Feed updates when new activity occurs

#### Badges System
**Test**: Achievement badges
- [ ] View user badges on profile
- [ ] Hover over badge - shows tooltip with description
- [ ] Check earned date is displayed
- [ ] Verify different badge types show correct icons

**Expected**: Complete social experience

---

### ✅ 2. Push Notifications

#### Notification Bell
**Test**: Notification UI
- [ ] Check notification bell in header
- [ ] See unread count badge
- [ ] Click bell - opens notification panel
- [ ] Panel shows recent notifications
- [ ] Mark as read - badge updates
- [ ] Mark all as read - clears badge
- [ ] Delete notification - removes from list

#### Notification Types
**Test**: Different notification types
- [ ] New follower notification
- [ ] Friend joined station
- [ ] Playlist shared
- [ ] Badge earned
- [ ] Check each has correct icon and message

#### Push Subscription
**Test**: Web Push API
- [ ] Go to notification settings
- [ ] Click "Enable push notifications"
- [ ] Accept browser permission prompt
- [ ] Verify subscription status shows "Enabled"
- [ ] Send test notification
- [ ] Should receive browser notification
- [ ] Click notification - opens app

**Browser Testing**: Chrome, Edge, Firefox (Safari doesn't support Web Push)

#### Notification Preferences
**Test**: Granular settings
- [ ] Open notification settings
- [ ] Toggle individual notification types
- [ ] Toggle email notifications
- [ ] Toggle sound/desktop notifications
- [ ] Save settings - preferences persist
- [ ] Verify only enabled types are received

**Expected**: Complete notification system

---

### ✅ 3. Analytics Dashboard

#### Listening Stats
**Test**: Stats overview
- [ ] Navigate to analytics dashboard
- [ ] See listening time stats
- [ ] Check tracks played count
- [ ] View unique artists count
- [ ] See average session length
- [ ] Verify trend indicators (up/down arrows)

#### Period Selection
**Test**: Time periods
- [ ] Switch to "This Week" - stats update
- [ ] Switch to "This Month" - stats update
- [ ] Switch to "This Year" - stats update
- [ ] Switch to "All Time" - stats update
- [ ] Charts reflect selected period

#### Charts
**Test**: Data visualization
- [ ] View listening trends line chart
- [ ] Check data points are accurate
- [ ] Hover over chart - shows tooltip
- [ ] View genre distribution pie chart
- [ ] Verify percentages add up to 100%
- [ ] Check legend shows all genres

#### Top Artists
**Test**: Artist rankings
- [ ] View top artists list
- [ ] Check ranking (1, 2, 3, etc.)
- [ ] See artist images
- [ ] View play counts and listening time
- [ ] Check trend indicators (rising/falling/stable)

#### Data Export
**Test**: Export functionality
- [ ] Click "Export Data" button
- [ ] File downloads (JSON format)
- [ ] Open file - verify data is correct
- [ ] Check all stats are included

**Expected**: Comprehensive analytics with visualizations

---

## 🧪 Sprint 4: UX & Polish (4 Items)

### ✅ 1. Accessibility (WCAG 2.1 AA)

#### Keyboard Navigation
**Test**: Navigate without mouse
- [ ] Tab through entire page
- [ ] Focus indicators are visible
- [ ] Skip to main content link appears on focus
- [ ] Tab order is logical
- [ ] Can reach all interactive elements
- [ ] Enter activates buttons/links
- [ ] Escape closes modals

#### Screen Reader Testing
**Test**: Use screen reader (NVDA/JAWS/VoiceOver)
- [ ] All images have alt text
- [ ] Buttons have accessible labels
- [ ] Form inputs have labels
- [ ] Live regions announce changes
- [ ] ARIA landmarks are present
- [ ] Heading hierarchy is correct

**Screen Readers to Test**:
- NVDA (Windows - free)
- JAWS (Windows - trial)
- VoiceOver (Mac - built-in)
- Narrator (Windows - built-in)

#### Focus Management
**Test**: Modal focus trapping
- [ ] Open modal
- [ ] Press Tab - focus stays in modal
- [ ] Press Shift+Tab - focus cycles backward
- [ ] Press Escape - modal closes, focus returns
- [ ] First element is focused on open

#### Color Contrast
**Test**: Text readability
- [ ] Check all text against background
- [ ] Use browser DevTools Lighthouse
- [ ] Run accessibility audit
- [ ] Should pass WCAG AA (4.5:1 for normal text)
- [ ] Check dark mode contrast too

#### Keyboard Shortcuts
**Test**: All shortcuts work
- [ ] Press `?` - shortcuts help appears
- [ ] Try each shortcut listed
- [ ] Shortcuts don't conflict with browser
- [ ] Shortcuts work in correct context

**Expected**: Fully accessible to all users

---

### ✅ 2. Onboarding Flow

#### Welcome Screen
**Test**: New user experience
- [ ] Clear localStorage (simulate new user)
- [ ] Refresh page
- [ ] Onboarding modal appears
- [ ] See welcome screen with features
- [ ] Click "Get Started"

#### Spotify Connect
**Test**: OAuth flow
- [ ] Spotify connect screen appears
- [ ] Shows benefits list
- [ ] Click "Connect Spotify" (simulated)
- [ ] Loading state shows
- [ ] Success state shows after connection
- [ ] Click "Continue"

#### Profile Setup
**Test**: Profile creation
- [ ] See profile setup form
- [ ] Enter display name (required)
- [ ] Add bio (optional)
- [ ] Add location (optional)
- [ ] Upload avatar button present
- [ ] "Continue" disabled until name entered
- [ ] Click "Continue"

#### Genre Selection
**Test**: Preferences
- [ ] See genre grid
- [ ] Click genres to select
- [ ] Selected genres are highlighted
- [ ] Need 3+ to continue
- [ ] Badge shows "X selected"
- [ ] Click "Continue"

#### Progress Indicator
**Test**: Progress tracking
- [ ] Progress bar shows current step
- [ ] Percentage updates with each step
- [ ] Step count shows "Step X of 7"

#### Completion
**Test**: Finish onboarding
- [ ] Completion screen shows
- [ ] Quick tips are displayed
- [ ] Click "Start Exploring"
- [ ] Modal closes
- [ ] Onboarding marked complete
- [ ] Doesn't show again on refresh

**Expected**: Smooth onboarding experience

---

### ✅ 3. AI Recommendations

#### Personalized Recommendations
**Test**: For You page
- [ ] Navigate to recommendations/discover
- [ ] See "For You" tab
- [ ] View Discover Weekly section
- [ ] See 10+ track cards
- [ ] Track images load
- [ ] Artist names displayed

#### Daily Mixes
**Test**: Algorithmic playlists
- [ ] See Daily Mixes section
- [ ] Up to 6 mix cards displayed
- [ ] Each has name and description
- [ ] Click mix - opens detail view (if implemented)

#### Tabs
**Test**: Different recommendation types
- [ ] Click "By Mood" tab
- [ ] Click "From Friends" tab
- [ ] Click "New Releases" tab
- [ ] Each tab shows relevant content or placeholder

#### Loading States
**Test**: Data fetching
- [ ] Refresh page
- [ ] Skeleton loaders appear
- [ ] Content loads smoothly
- [ ] No layout shift

**Expected**: Personalized music discovery

---

### ✅ 4. Undo/Redo System

#### Toast with Undo
**Test**: Undo from toast
- [ ] Delete a track from playlist
- [ ] Toast appears with success message
- [ ] "Undo" button is visible
- [ ] Click "Undo" within 5 seconds
- [ ] Track is restored
- [ ] Toast shows "Undid: ..."

#### Keyboard Shortcuts
**Test**: Ctrl+Z and Ctrl+Shift+Z
- [ ] Perform an undoable action
- [ ] Press `Ctrl+Z` - action is undone
- [ ] Toast shows undo confirmation
- [ ] Press `Ctrl+Shift+Z` or `Ctrl+Y` - action is redone
- [ ] Toast shows redo confirmation

#### Multiple Actions
**Test**: Undo history
- [ ] Perform 3-4 actions (follow, delete, etc.)
- [ ] Press `Ctrl+Z` multiple times
- [ ] Each action undone in reverse order
- [ ] Perform new action
- [ ] Redo stack is cleared

#### Command Types
**Test**: Different commands
- [ ] Delete track from playlist
- [ ] Update profile
- [ ] Follow/unfollow user
- [ ] All support undo/redo

**Expected**: Reliable undo/redo with keyboard shortcuts

---

## 🔧 Developer Testing

### Performance Testing
**Test**: App performance
- [ ] Open Chrome DevTools Performance tab
- [ ] Record interaction (navigate, click, scroll)
- [ ] Stop recording
- [ ] Check for long tasks (> 50ms)
- [ ] Verify no layout thrashing
- [ ] Check memory usage

### Bundle Size
**Test**: Build output
```bash
cd frontend
npm run build
```
- [ ] Check build output sizes
- [ ] Main bundle < 500KB (gzipped)
- [ ] Code splitting is working
- [ ] Verify tree shaking

### Network Testing
**Test**: Slow connections
- [ ] Open DevTools Network tab
- [ ] Throttle to "Slow 3G"
- [ ] Navigate app
- [ ] Check loading states appear
- [ ] Data loads without errors
- [ ] Images lazy load

### Error Handling
**Test**: API failures (mock)
- [ ] Simulate 500 error
- [ ] Error boundary catches it
- [ ] User sees error message
- [ ] Can retry action
- [ ] App remains stable

---

## 🐛 Common Issues & Solutions

### Issue: Keyboard shortcuts not working
**Solution**:
- Check if focus is in an input field
- Try clicking outside input first
- Check browser console for conflicts

### Issue: React Query devtools not showing
**Solution**:
- Only appears in development mode
- Check bottom-right corner for icon
- Verify `@tanstack/react-query-devtools` installed

### Issue: Zustand devtools not working
**Solution**:
- Install Redux DevTools extension
- Open Redux DevTools tab
- Look for "ZustandStore" instances

### Issue: Web Push not supported
**Solution**:
- Only works in Chrome, Edge, Firefox
- Safari doesn't support Web Push API
- Requires HTTPS in production

### Issue: PWA install not showing
**Solution**:
- Requires valid manifest.json
- Service worker must be registered
- HTTPS required (except localhost)
- Check DevTools Application tab

---

## ✅ Testing Checklist Summary

### Critical Path (Must Test)
- [ ] User can navigate the app
- [ ] User can search for content
- [ ] User can view profiles
- [ ] User can receive notifications
- [ ] User can view analytics
- [ ] Keyboard navigation works
- [ ] Mobile responsive design works
- [ ] Dark mode toggles correctly

### Important Features
- [ ] Onboarding flow for new users
- [ ] Follow/unfollow functionality
- [ ] Activity feed updates
- [ ] Recommendations load
- [ ] Undo/redo system works
- [ ] Toast notifications appear
- [ ] Error boundaries catch errors

### Nice to Have
- [ ] PWA installation
- [ ] Push notifications (browser-dependent)
- [ ] All keyboard shortcuts
- [ ] Screen reader compatibility
- [ ] All accessibility features

---

## 📊 Test Results Template

```markdown
## Test Session: [Date]
**Tester**: [Name]
**Browser**: [Chrome/Firefox/Safari/Edge]
**Device**: [Desktop/Mobile/Tablet]

### Sprint 1 Results
- [ ] Loading Skeletons: ✅ Pass / ❌ Fail
- [ ] Search: ✅ Pass / ❌ Fail
- [ ] Keyboard Shortcuts: ✅ Pass / ❌ Fail
- [ ] Mobile Responsive: ✅ Pass / ❌ Fail
- [ ] PWA: ✅ Pass / ❌ Fail

### Sprint 2 Results
- [ ] Zustand: ✅ Pass / ❌ Fail
- [ ] React Query: ✅ Pass / ❌ Fail
- [ ] API Layer: ✅ Pass / ❌ Fail
- [ ] Feature Flags: ✅ Pass / ❌ Fail

### Sprint 3 Results
- [ ] Profiles: ✅ Pass / ❌ Fail
- [ ] Notifications: ✅ Pass / ❌ Fail
- [ ] Analytics: ✅ Pass / ❌ Fail

### Sprint 4 Results
- [ ] Accessibility: ✅ Pass / ❌ Fail
- [ ] Onboarding: ✅ Pass / ❌ Fail
- [ ] Recommendations: ✅ Pass / ❌ Fail
- [ ] Undo/Redo: ✅ Pass / ❌ Fail

### Issues Found
1. [Issue description]
2. [Issue description]

### Overall Status
✅ Ready for production / ⚠️ Needs fixes / ❌ Not ready
```

---

## 🚀 Next Steps After Testing

1. **Log all issues** found during testing
2. **Prioritize fixes** (critical, high, medium, low)
3. **Create GitHub issues** for tracking
4. **Fix critical bugs** before moving forward
5. **Re-test** after fixes
6. **Consider deploying** if tests pass
7. **Proceed to Sprint 5** (Performance) when ready

---

**Happy Testing!** 🧪
