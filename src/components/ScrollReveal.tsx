import React, { ReactNode } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  threshold?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  duration = 700,
  delay = 0,
  threshold = 0.6,
}) => {
  const { elementRef, animationStyle } = useScrollReveal({
    duration,
    delay,
    threshold,
  });

  return (
    <div
      ref={elementRef}
      style={animationStyle}
      className={className}
    >
      {children}
    </div>
  );
};
