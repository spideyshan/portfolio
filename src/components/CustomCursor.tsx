'use client';

import { useEffect, useState, useRef } from 'react';
import styles from '@/app/page.module.css';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState({ x: 0, y: 0 });
  const [isHidden, setIsHidden] = useState(true);
  const [hoverType, setHoverType] = useState<'button' | 'link' | 'card' | null>(null);
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
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handlePointerChange);
    } else {
      mediaQuery.addListener(handlePointerChange);
    }

    if (mediaQuery.matches) {
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handlePointerChange);
        } else {
          mediaQuery.removeListener(handlePointerChange);
        }
      };
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

    // Detect if mouse is over an interactive element or a specific card container
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const isCard = target.closest(`.${styles.projectCard}`) !== null ||
                     target.closest(`.${styles.achievementCard}`) !== null ||
                     target.closest(`.${styles.certificationCard}`) !== null ||
                     target.closest(`.${styles.educationCard}`) !== null ||
                     target.closest(`.${styles.statCard}`) !== null;
      
      const isButton = target.tagName === 'BUTTON' ||
                       target.closest('button') !== null ||
                       target.closest('[role="button"]') !== null ||
                       (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'submit');

      const isLink = target.tagName === 'A' || target.closest('a') !== null;
      
      if (isButton) {
        setHoverType('button');
      } else if (isLink) {
        setHoverType('link');
      } else if (isCard) {
        setHoverType('card');
      } else {
        setHoverType(null);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    window.addEventListener('mouseover', onMouseOver);

    // Smooth spring/lag animation loop (lerp factor: 0.15 gives a ~0.1s delay)
    const animateTrail = () => {
      const dx = mouseRef.current.x - trailRef.current.x;
      const dy = mouseRef.current.y - trailRef.current.y;
      
      trailRef.current.x += dx * 0.15;
      trailRef.current.y += dy * 0.15;
      
      setTrail({ x: trailRef.current.x, y: trailRef.current.y });
      requestRef.current = requestAnimationFrame(animateTrail);
    };
    
    requestRef.current = requestAnimationFrame(animateTrail);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handlePointerChange);
      } else {
        mediaQuery.removeListener(handlePointerChange);
      }
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
      {/* 1. Inner Glowing Ring */}
      <div
        className={`${styles.cursorInner} ${hoverType ? styles[`cursorInnerHovered_${hoverType}`] : ''} ${isClicked ? styles.cursorInnerClicked : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
      />
      {/* 2. Lagging Outer Glowing Ring */}
      <div
        className={`${styles.cursorOuter} ${hoverType ? styles[`cursorOuterHovered_${hoverType}`] : ''} ${isClicked ? styles.cursorOuterClicked : ''}`}
        style={{
          left: `${trail.x}px`,
          top: `${trail.y}px`
        }}
      />
    </>
  );
}
