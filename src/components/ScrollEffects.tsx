'use client';

import { useEffect, useState } from 'react';
import styles from '@/app/page.module.css';

export default function ScrollEffects() {
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [logoVisible, setLogoVisible] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    // 1. Shutter preloader timeline
    const logoTimeout = setTimeout(() => {
      setLogoVisible(false);
    }, 1200);

    const exitingTimeout = setTimeout(() => {
      setExiting(true);
    }, 1400);

    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 2650);

    return () => {
      clearTimeout(logoTimeout);
      clearTimeout(exitingTimeout);
      clearTimeout(loadingTimeout);
    };
  }, []);

  useEffect(() => {
    // 2. Scroll and Back to Top controllers
    const handleScroll = () => {
      // Calculate scroll progress percentage
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }

      // Toggle Back to Top button visibility
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // 3. Fallback Scroll Reveal Observer for browsers without native scroll-driven animations (e.g. Firefox)
    if (typeof window !== 'undefined' && !window.CSS?.supports('(animation-timeline: view()) and (animation-range: entry)')) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add(styles.sectionVisible);
            }
          });
        },
        {
          rootMargin: '-50px 0px',
          threshold: 0.1
        }
      );

      document.querySelectorAll(`.${styles.section}`).forEach((el) => {
        observer.observe(el);
      });

      return () => observer.disconnect();
    }
  }, []);


  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {/* Scroll Progress Bar */}
      <div 
        className={styles.scrollProgress} 
        style={{ width: `${scrollProgress}%` }} 
        aria-hidden="true"
      />

      {/* Page Preloader / Glassmorphic Fade Splash Screen */}
      {loading && (
        <div className={`${styles.pagePreloader} ${exiting ? styles.pagePreloaderExiting : ''}`}>
          {/* Shockwave Ripple */}
          <div className={`${styles.preloaderRipple} ${!logoVisible ? styles.preloaderRippleActive : ''}`}></div>

          {/* Central Glassmorphic Logo */}
          <div className={`${styles.preloaderLogoContainer} ${!logoVisible ? styles.preloaderLogoFadeOut : ''}`}>
            <div className={styles.preloaderLogoCircle}>
              <span className={styles.preloaderLogoText}>S</span>
              <div className={styles.preloaderLogoRingOuter}></div>
              <div className={styles.preloaderLogoRingInner}></div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Back to Top Button */}
      <button 
        onClick={scrollToTop} 
        className={`${styles.backToTopBtn} ${showBackToTop ? styles.backToTopVisible : ''}`} 
        aria-label="Back to top"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>
    </>
  );
}
