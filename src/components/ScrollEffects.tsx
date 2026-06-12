'use client';

import { useEffect, useState } from 'react';
import styles from '@/app/page.module.css';

export default function ScrollEffects() {
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    // 1. Loading animation controller
    const handleLoad = () => {
      setLoading(false);
    };

    if (document.readyState === 'complete') {
      setLoading(false);
    } else {
      window.addEventListener('load', handleLoad);
      const timer = setTimeout(() => setLoading(false), 1200); // safety fallback
      return () => {
        window.removeEventListener('load', handleLoad);
        clearTimeout(timer);
      };
    }
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

      {/* Page Preloader */}
      {loading && (
        <div className={styles.pagePreloader}>
          <div className={styles.preloaderContent}>
            <div className={styles.preloaderSpinner} />
            <span className={styles.preloaderText}>Loading Portfolio...</span>
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
