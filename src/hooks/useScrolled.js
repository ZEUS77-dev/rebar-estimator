/** True once the page has scrolled past `threshold`.
 *
 *  Drives the sticky header the way jindalsteel.om does it: the bar starts
 *  open and transparent, then collapses to a solid, compact strip once you
 *  leave the top of the page. */

import { useEffect, useState } from 'react';

export function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const read = () => setScrolled(window.scrollY > threshold);
    read(); // a reload can restore a mid-page scroll position
    // Passive: this listener must never block scrolling.
    window.addEventListener('scroll', read, { passive: true });
    return () => window.removeEventListener('scroll', read);
  }, [threshold]);

  return scrolled;
}
