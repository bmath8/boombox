import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

// Developer harness pages (mocked frame, Spotify OAuth test). Kept for local work, but a
// production build answers 404 so they aren't part of the public app.
export default function DevOnlyLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound();
  return children;
}
