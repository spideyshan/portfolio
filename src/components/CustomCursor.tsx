'use client';

import { useEffect, useState, useRef } from 'react';
import styles from '@/app/page.module.css';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState({ x: 0, y: 0 });
  const [isHidden, setIsHidden] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const requestRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const trailRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Check if the device has a coarse pointer (touch device)
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const handlePointerChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };
    
    handlePointerChange(mediaQuery);
    mediaQuery.addEventListener('change', handlePointerChange);

    if (mediaQuery.matches) {
      return () => mediaQuery.removeEventListener('change', handlePointerChange);
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      setPosition({ x: e.clientX, y: e.clientY });
      if (isHidden) setIsHidden(false);
    };

    const onMouseDown = () => setIsClicked(true);
    const onMouseUp = () => setIsClicked(false);
    
    const onMouseLeave = () => setIsHidden(true);
    const onMouseEnter = () => setIsHidden(false);

    // Detect if mouse is over an interactive element
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const isInteractive = 
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('a') !== null ||
        target.closest('button') !== null ||
        target.closest('[role="button"]') !== null;
        
      setIsHovered(!!isInteractive);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    window.addEventListener('mouseover', onMouseOver);

    // Smooth lerp loop for the trailing outer ring
    const animateTrail = () => {
      const dx = mouseRef.current.x - trailRef.current.x;
      const dy = mouseRef.current.y - trailRef.current.y;
      
      // Lerp factor of 0.15 gives a smooth lagging/spring effect
      trailRef.current.x += dx * 0.15;
      trailRef.current.y += dy * 0.15;
      
      setTrail({ x: trailRef.current.x, y: trailRef.current.y });
      requestRef.current = requestAnimationFrame(animateTrail);
    };
    
    requestRef.current = requestAnimationFrame(animateTrail);

    return () => {
      mediaQuery.removeEventListener('change', handlePointerChange);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      window.removeEventListener('mouseover', onMouseOver);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isHidden]);

  if (isMobile || isHidden) return null;

  return (
    <>
      {/* 1. Central Cursor Dot */}
      <div
        className={`${styles.cursorDot} ${isHovered ? styles.cursorDotHovered : ''} ${isClicked ? styles.cursorDotClicked : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
      />
      {/* 2. Lagging Outer Ring */}
      <div
        className={`${styles.cursorRing} ${isHovered ? styles.cursorRingHovered : ''} ${isClicked ? styles.cursorRingClicked : ''}`}
        style={{
          left: `${trail.x}px`,
          top: `${trail.y}px`
        }}
      />
    </>
  );
}
