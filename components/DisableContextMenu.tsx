'use client';

import { useEffect } from 'react';

// Right-clicking (or long-pressing on mobile) a game canvas triggers the browser's
// native context menu — "Print...", "Search image with Google", "Save image as", etc.
// Several games bind right-click to an in-game action, so this menu is always noise.
export default function DisableContextMenu() {
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  return null;
}
