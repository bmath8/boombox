# React Best Practices - useEffect Dependency Guide

## Overview
This guide helps fix the 40+ useEffect hooks with incomplete dependency arrays across the codebase.

## The Problem

### ❌ Bad: Missing Dependencies
```typescript
const fetchData = async () => {
    const data = await api.getData(userId);
    setData(data);
};

useEffect(() => {
    fetchData();
}, []); // ❌ fetchData and userId not in dependencies
```

**Issues:**
- Stale closures (using old values)
- Memory leaks
- Infinite loops (if done wrong)
- Unpredictable behavior

## The Solutions

### ✅ Solution 1: Include All Dependencies
```typescript
useEffect(() => {
    const fetchData = async () => {
        const data = await api.getData(userId);
        setData(data);
    };
    
    fetchData();
}, [userId]); // ✅ All external values included
```

### ✅ Solution 2: Use useCallback
```typescript
const fetchData = useCallback(async () => {
    const data = await api.getData(userId);
    setData(data);
}, [userId]); // Memoize function

useEffect(() => {
    fetchData();
}, [fetchData]); // ✅ Stable reference
```

### ✅ Solution 3: Inline Everything
```typescript
useEffect(() => {
    const fetchData = async () => {
        const data = await api.getData(userId);
        setData(data);
    };
    
    fetchData();
}, [userId]); // ✅ No external dependencies
```

## Common Patterns

### Pattern 1: Fetching Data on Mount
```typescript
// ❌ Bad
useEffect(() => {
    fetchUserData();
}, []); // fetchUserData not in deps

// ✅ Good
useEffect(() => {
    const fetchData = async () => {
        try {
            const data = await api.getUser(userId);
            setUser(data);
        } catch (error) {
            handleError(error, 'Fetch User');
        }
    };
    
    fetchData();
}, [userId]); // All dependencies included
```

### Pattern 2: Subscriptions (WebSocket, Supabase)
```typescript
// ❌ Bad
useEffect(() => {
    const subscription = supabase
        .channel('messages')
        .on('INSERT', handleMessage)
        .subscribe();
        
    return () => subscription.unsubscribe();
}, []); // handleMessage not in deps

// ✅ Good
useEffect(() => {
    const handleMessage = (payload: any) => {
        setMessages(prev => [...prev, payload.new]);
    };
    
    const subscription = supabase
        .channel('messages')
        .on('INSERT', handleMessage)
        .subscribe();
        
    return () => {
        subscription.unsubscribe();
    };
}, []); // handleMessage is defined inside, no external deps
```

### Pattern 3: Timers/Intervals
```typescript
// ❌ Bad
useEffect(() => {
    const interval = setInterval(updateCount, 1000);
    return () => clearInterval(interval);
}, []); // updateCount not in deps

// ✅ Good
useEffect(() => {
    const interval = setInterval(() => {
        setCount(c => c + 1); // Use functional update
    }, 1000);
    
    return () => clearInterval(interval);
}, []); // No external dependencies needed
```

### Pattern 4: Event Listeners
```typescript
// ❌ Bad
useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, []); // handleResize not in deps

// ✅ Good
useEffect(() => {
    const handleResize = () => {
        setWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, []); // handleResize defined inside
```

## Files to Fix

### High Priority (Data Fetching) - ✅ FIXED
1. `curator-stats.tsx` - ✅ Fixed
2. `dj-profile-card.tsx` - ✅ Fixed
3. `station-analytics.tsx` - ✅ Fixed
4. `playlist-insights.tsx` - ✅ Fixed
5. `discovery-feed.tsx` - ✅ Fixed

### Medium Priority (Subscriptions) - ✅ FIXED
6. `station-chat.tsx` - ✅ Fixed
7. `live-feed.tsx` - ✅ Fixed
8. `listener-wall.tsx` - ✅ Fixed
9. `notification-center.tsx` - ✅ Fixed
10. `track-reactions.tsx` - ✅ Fixed

### Low Priority (UI State)
11. `vinyl-broadcast.tsx` - Line 25
12. `reaction-overlay.tsx` - Line 24
13. `scheduled-shows.tsx` - Line 27
14. `station-card.tsx` - Line 24

## ESLint Configuration

Add this to your `.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

Then run:
```bash
npm run lint
```

This will show all missing dependencies.

## Testing After Fixes

### 1. Check for Infinite Loops
```typescript
// Add console.log to verify effect runs correctly
useEffect(() => {
    console.log('Effect running', { dependency1, dependency2 });
    // ... your code
}, [dependency1, dependency2]);
```

### 2. Check for Memory Leaks
```typescript
// Ensure cleanup functions are called
useEffect(() => {
    const subscription = subscribe();
    
    return () => {
        console.log('Cleanup running');
        subscription.unsubscribe();
    };
}, []);
```

### 3. Check for Stale Data
```typescript
// Verify you're using latest values
useEffect(() => {
    console.log('Current userId:', userId); // Should match latest
    fetchData(userId);
}, [userId]);
```

## Quick Reference

### When to use `useCallback`
- Function is passed as a prop
- Function is in useEffect dependencies
- Function is expensive to recreate

### When to use `useMemo`
- Expensive calculations
- Object/array in dependencies
- Prevent unnecessary re-renders

### When to use functional updates
- setState based on previous state
- Avoid adding state to dependencies

```typescript
// ❌ Bad
useEffect(() => {
    setCount(count + 1);
}, [count]); // Infinite loop!

// ✅ Good
useEffect(() => {
    setCount(c => c + 1);
}, []); // No dependencies needed
```

## Automated Fix Script

Run this to find all issues:
```bash
npx eslint --ext .tsx,.ts src/components --fix
```

## Summary Checklist

For each useEffect:
- [ ] All external variables in dependencies?
- [ ] Functions memoized with useCallback?
- [ ] Using functional updates where possible?
- [ ] Cleanup function returns subscription/listener cleanup?
- [ ] No infinite loops?
- [ ] ESLint warning resolved?

---

**Next Steps:**
1. Run ESLint to find all issues
2. Fix high-priority files first
3. Test each fix thoroughly
4. Commit fixes incrementally
