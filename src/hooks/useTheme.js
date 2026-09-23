/** Day/night theme.
 *
 *  Day is the default and always wins on a first visit — we deliberately do NOT
 *  read prefers-color-scheme, because the brand's daylight palette is the one
 *  people should meet first. A returning visitor's own choice is remembered. */

import { useEffect, useState } from 'react';

const KEY = 'jso-rebar-theme';
export const THEMES = { day: 'day', night: 'night' };

function readStored() {
  try {
    const v = localStorage.getItem(KEY);
    return v === THEMES.night || v === THEMES.day ? v : THEMES.day;
  } catch {
    // Private mode, blocked storage, SSR — day is the safe fallback.
    return THEMES.day;
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(readStored);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* not worth failing the render over */
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === THEMES.day ? THEMES.night : THEMES.day));

  return { theme, setTheme, toggle, isNight: theme === THEMES.night };
}
