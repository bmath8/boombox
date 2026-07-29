# Accessibility Guide - FAM Music V.2

## Overview
This guide provides accessibility best practices and implementation guidelines for FAM Music V.2.

## WCAG 2.1 Compliance Goals
- **Level AA** compliance (minimum)
- **Level AAA** where feasible

## Key Principles

### 1. Perceivable
Users must be able to perceive the information being presented.

### 2. Operable
Users must be able to operate the interface.

### 3. Understandable
Users must be able to understand the information and operation.

### 4. Robust
Content must be robust enough to work with assistive technologies.

## Implementation Checklist

### ✅ Keyboard Navigation

#### All Interactive Elements
```tsx
// ✅ Good: Keyboard accessible
<button
    onClick={handleClick}
    onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    }}
>
    Play
</button>

// ❌ Bad: Only mouse accessible
<div onClick={handleClick}>Play</div>
```

#### Focus Indicators
```css
/* Visible focus indicators */
button:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}

/* Don't remove outlines! */
button:focus {
    outline: none; /* ❌ Bad */
}
```

#### Tab Order
```tsx
// Use tabIndex appropriately
<div role="button" tabIndex={0}>Clickable</div>
<div tabIndex={-1}>Not in tab order</div>
```

### ✅ ARIA Labels

#### Buttons
```tsx
// Descriptive labels
<button aria-label="Play track: Bohemian Rhapsody">
    <PlayIcon />
</button>

// Button with visible text
<button>
    <PlayIcon aria-hidden="true" />
    Play
</button>
```

#### Form Inputs
```tsx
<label htmlFor="search">Search tracks</label>
<input
    id="search"
    type="text"
    aria-label="Search tracks"
    aria-describedby="search-help"
/>
<span id="search-help">Enter artist or track name</span>
```

#### Live Regions
```tsx
// Announce dynamic content
<div
    role="status"
    aria-live="polite"
    aria-atomic="true"
>
    {statusMessage}
</div>

// For urgent updates
<div
    role="alert"
    aria-live="assertive"
>
    {errorMessage}
</div>
```

### ✅ Semantic HTML

```tsx
// ✅ Good: Semantic structure
<header>
    <nav aria-label="Main navigation">
        <ul>
            <li><a href="/">Home</a></li>
        </ul>
    </nav>
</header>

<main>
    <article>
        <h1>Track Title</h1>
        <section aria-labelledby="comments-heading">
            <h2 id="comments-heading">Comments</h2>
        </section>
    </article>
</main>

// ❌ Bad: Div soup
<div className="header">
    <div className="nav">
        <div className="link">Home</div>
    </div>
</div>
```

### ✅ Color Contrast

#### Minimum Ratios (WCAG AA)
- **Normal text**: 4.5:1
- **Large text** (18pt+): 3:1
- **UI components**: 3:1

```css
/* ✅ Good contrast */
.text {
    color: #ffffff; /* White */
    background: #1a1a1a; /* Dark gray */
    /* Contrast ratio: 15.8:1 */
}

/* ❌ Bad contrast */
.text-bad {
    color: #888888; /* Light gray */
    background: #666666; /* Medium gray */
    /* Contrast ratio: 1.5:1 - FAIL */
}
```

### ✅ Screen Reader Support

#### Skip Links
```tsx
// Allow users to skip navigation
<a href="#main-content" className="skip-link">
    Skip to main content
</a>

<main id="main-content">
    {/* Content */}
</main>
```

```css
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--primary);
    color: white;
    padding: 8px;
    z-index: 100;
}

.skip-link:focus {
    top: 0;
}
```

#### Hidden Content
```tsx
// Visually hidden but screen reader accessible
<span className="sr-only">
    Currently playing: {trackName}
</span>
```

```css
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}
```

#### ARIA Descriptions
```tsx
<button
    aria-label="Play"
    aria-describedby="play-description"
>
    <PlayIcon />
</button>
<span id="play-description" className="sr-only">
    Plays the current track from the beginning
</span>
```

### ✅ Images & Media

#### Alt Text
```tsx
// ✅ Good: Descriptive alt text
<img
    src={albumArt}
    alt="Album cover for Dark Side of the Moon by Pink Floyd"
/>

// Decorative images
<img
    src={decoration}
    alt=""
    aria-hidden="true"
/>
```

#### Audio Controls
```tsx
<audio
    controls
    aria-label="Track preview: Bohemian Rhapsody"
>
    <source src={previewUrl} type="audio/mpeg" />
    <track
        kind="captions"
        src={captionsUrl}
        label="English"
    />
</audio>
```

### ✅ Forms

#### Labels & Validation
```tsx
<form>
    <div>
        <label htmlFor="email">Email</label>
        <input
            id="email"
            type="email"
            required
            aria-required="true"
            aria-invalid={hasError}
            aria-describedby={hasError ? 'email-error' : undefined}
        />
        {hasError && (
            <span id="email-error" role="alert">
                Please enter a valid email address
            </span>
        )}
    </div>
</form>
```

#### Error Messages
```tsx
// Announce errors to screen readers
<div role="alert" aria-live="assertive">
    {error && <p>{error}</p>}
</div>
```

### ✅ Loading States

```tsx
// Accessible loading indicator
<div
    role="status"
    aria-live="polite"
    aria-busy={isLoading}
>
    {isLoading ? (
        <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            <span className="sr-only">Loading tracks...</span>
        </>
    ) : (
        <TrackList />
    )}
</div>
```

### ✅ Modals & Dialogs

```tsx
<Dialog
    open={isOpen}
    onOpenChange={setIsOpen}
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
>
    <DialogContent>
        <DialogTitle id="dialog-title">
            Confirm Delete
        </DialogTitle>
        <DialogDescription id="dialog-description">
            Are you sure you want to delete this track?
        </DialogDescription>
        <DialogFooter>
            <button onClick={handleCancel}>Cancel</button>
            <button onClick={handleConfirm}>Delete</button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

## Component-Specific Guidelines

### Radio Player
```tsx
<div role="region" aria-label="Radio player">
    <button
        aria-label={isPlaying ? 'Pause' : 'Play'}
        aria-pressed={isPlaying}
    >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </button>
    
    <div
        role="slider"
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={volume}
        tabIndex={0}
    />
    
    <div aria-live="polite" aria-atomic="true">
        Now playing: {currentTrack}
    </div>
</div>
```

### Track List
```tsx
<ul role="list" aria-label="Track queue">
    {tracks.map((track, index) => (
        <li key={track.id} role="listitem">
            <button
                aria-label={`Play ${track.name} by ${track.artist}`}
                aria-describedby={`track-${track.id}-info`}
            >
                <PlayIcon aria-hidden="true" />
            </button>
            <div id={`track-${track.id}-info`}>
                <span>{track.name}</span>
                <span className="sr-only">by</span>
                <span>{track.artist}</span>
            </div>
        </li>
    ))}
</ul>
```

### Voting System
```tsx
<div role="group" aria-label="Vote on track">
    <button
        aria-label="Upvote"
        aria-pressed={userVote === 1}
        onClick={() => handleVote(1)}
    >
        <ThumbsUp aria-hidden="true" />
    </button>
    <span aria-live="polite">
        {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
    </span>
    <button
        aria-label="Downvote"
        aria-pressed={userVote === -1}
        onClick={() => handleVote(-1)}
    >
        <ThumbsDown aria-hidden="true" />
    </button>
</div>
```

## Testing

### Automated Testing
```bash
# Install axe-core
npm install --save-dev @axe-core/react

# Add to your test setup
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// Test component
test('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
});
```

### Manual Testing

#### Keyboard Only
1. Unplug mouse
2. Navigate entire app with Tab/Shift+Tab
3. Activate with Enter/Space
4. Verify all functionality accessible

#### Screen Reader
1. **Windows**: NVDA (free) or JAWS
2. **Mac**: VoiceOver (built-in)
3. **Linux**: Orca

#### Browser DevTools
1. Chrome: Lighthouse accessibility audit
2. Firefox: Accessibility Inspector
3. Edge: Accessibility Insights

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

## Priority Fixes

### High Priority
1. Add ARIA labels to all icon buttons
2. Ensure keyboard navigation works
3. Add focus indicators
4. Fix color contrast issues

### Medium Priority
5. Add skip links
6. Improve form validation messages
7. Add loading state announcements
8. Improve modal accessibility

### Low Priority
9. Add keyboard shortcuts
10. Improve touch targets (min 44x44px)
11. Add reduced motion support
12. Improve error recovery

---

**Target**: WCAG 2.1 Level AA compliance  
**Timeline**: Implement high-priority fixes first  
**Testing**: Use automated tools + manual testing
