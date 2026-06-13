'use client';

import { useEffect, useState } from 'react';
import styles from '@/app/page.module.css';

export default function ScrollEffects() {
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const words = ['Hello', 'Bonjour', 'Hola', 'Ciao', 'Namaste', 'Vanakkam', 'Welcome'];

  useEffect(() => {
    // 1. Progress simulation loop
    let interval: NodeJS.Timeout;
    let progressValue = 0;
    
    const step = () => {
      if (progressValue >= 100) {
        progressValue = 100;
        setProgress(100);
        setWordIndex(words.length - 1);
        
        // Delay slightly for 'Welcome', then slide curtain up
        setTimeout(() => {
          setExiting(true);
          // Unmount after curtain transition completes (800ms)
          setTimeout(() => {
            setLoading(false);
          }, 800);
        }, 300);
        
        clearInterval(interval);
      } else {
        // Increment progress non-linearly
        const diff = Math.random() * 8 + 3;
        progressValue = Math.min(progressValue + diff, 100);
        setProgress(progressValue);
      }
    };
    
    interval = setInterval(step, 80);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 2. Word cycling loop
    if (progress === 100) return;
    
    const cycleInterval = setInterval(() => {
      setWordIndex((prev) => {
        if (prev < words.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 200);
    
    return () => clearInterval(cycleInterval);
  }, [progress]);

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

      {/* Page Preloader / Curtain Splash Screen */}
      {loading && (
        <div className={`${styles.pagePreloader} ${exiting ? styles.pagePreloaderExiting : ''}`}>
          <div className={styles.preloaderContent}>
            <div className={styles.preloaderWordContainer}>
              <span key={words[wordIndex]} className={styles.preloaderWord}>
                {words[wordIndex]}
              </span>
            </div>
            <div className={styles.preloaderBarContainer}>
              <div className={styles.preloaderBar} style={{ width: `${progress}%` }} />
            </div>
            <span className={styles.preloaderPercentage}>
              {String(Math.round(progress)).padStart(3, '0')}%
            </span>
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
