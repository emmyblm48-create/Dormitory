"use client";

import { useEffect } from "react";

// Watches for `.reveal` elements within this page and fades each one up
// into place the first time it scrolls into view. Mount once per page.
// A MutationObserver keeps watching after mount because many pages render
// their `.reveal` cards only after an async data fetch resolves, i.e. after
// this component's own mount-time scan would otherwise have already run.
export function ScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );

    const observed = new WeakSet<Element>();
    const observeNew = () => {
      document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
        if (!observed.has(el)) {
          observed.add(el);
          io.observe(el);
        }
      });
    };

    observeNew();
    const mo = new MutationObserver(observeNew);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
