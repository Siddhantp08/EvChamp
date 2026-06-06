import { useEffect, useRef, useState } from 'react';

interface UseScrollFloatOptions {
  /** Strength factor: higher means more movement per scroll pixel */
  factor?: number; // 0.03–0.08 recommended
  /** Max translateY in px */
  max?: number; // 12–24 recommended
  /** Intersection threshold */
  threshold?: number;
}

export const useScrollFloat = (options: UseScrollFloatOptions = {}) => {
  const { factor = 0.05, max = 20, threshold = 0.05 } = options;
  const floatRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    const el = floatRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(el);

    let rAF = 0;
    const onScroll = () => {
      if (!isActive || !floatRef.current) return;
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        const rect = floatRef.current!.getBoundingClientRect();
        // Distance from viewport center
        const viewportCenter = window.innerHeight / 2;
        const delta = viewportCenter - rect.top; // positive when element above center
        let ty = delta * factor;
        // clamp
        if (ty > max) ty = max;
        if (ty < -max) ty = -max;
        setTranslateY(ty);
      });
    };

    // initial compute
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      observer.disconnect();
      if (rAF) cancelAnimationFrame(rAF);
    };
  }, [factor, max, threshold, isActive]);

  return {
    floatRef,
    floatStyle: {
      transform: `translateY(${translateY}px)`,
      transition: 'transform 120ms ease-out',
      willChange: 'transform',
    } as React.CSSProperties,
  };
};
