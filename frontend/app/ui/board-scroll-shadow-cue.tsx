'use client';

import React, { useEffect } from 'react';

const SCROLL_THRESHOLD = 10;

export function BoardScrollShadowCue() {
  useEffect(() => {
    const root = document.body;

    const sync = () => {
      if (window.scrollY > SCROLL_THRESHOLD) {
        root.setAttribute('data-board-scrolled', 'true');
      } else {
        root.removeAttribute('data-board-scrolled');
      }
    };

    sync();
    window.addEventListener('scroll', sync, { passive: true });
    return () => {
      window.removeEventListener('scroll', sync);
      root.removeAttribute('data-board-scrolled');
    };
  }, []);

  return <span className="board-scroll-shadow-cue-sensor" aria-hidden="true" />;
}
