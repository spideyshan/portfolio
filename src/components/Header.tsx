'use client';

import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import styles from '@/app/page.module.css';

interface HeaderProps {
  resumeUrl?: string;
}

export default function Header({ resumeUrl }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile menu drawer
  const closeMenu = () => setIsOpen(false);

  // Toggle body scroll locking when mobile menu drawer is open
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span>Portfolio</span>
          <span className={styles.logoDot} />
        </div>
        
        {/* Desktop Menu Links */}
        <ul className={styles.navLinks}>
          <li>
            <a href="#about" className={styles.navLink}>
              About
            </a>
          </li>
          <li>
            <a href="#skills" className={styles.navLink}>
              Tech Stack
            </a>
          </li>
          <li>
            <a href="#projects" className={styles.navLink}>
              Projects
            </a>
          </li>
          <li>
            <a href="#education" className={styles.navLink}>
              Education
            </a>
          </li>
          <li>
            <a href="#achievements" className={styles.navLink}>
              Achievements
            </a>
          </li>
          <li>
            <a href="#certifications" className={styles.navLink}>
              Certifications
            </a>
          </li>
          {resumeUrl && resumeUrl !== '#' && (
            <li>
              <a href="#resume" className={styles.navLink}>
                Resume
              </a>
            </li>
          )}
          <li>
            <a href="#contact" className={styles.navLink}>
              Contact
            </a>
          </li>
        </ul>

        {/* Header Actions (Theme Toggle & Mobile Hamburger) */}
        <div className={styles.navActions}>
          <ThemeToggle />
          
          <button 
            className={`${styles.hamburger} ${isOpen ? styles.hamburgerActive : ''}`} 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div className={`${styles.mobileMenu} ${isOpen ? styles.mobileMenuActive : ''}`}>
        <ul className={styles.mobileMenuLinks}>
          <li>
            <a href="#about" className={styles.mobileMenuLink} onClick={closeMenu}>
              About
            </a>
          </li>
          <li>
            <a href="#skills" className={styles.mobileMenuLink} onClick={closeMenu}>
              Tech Stack
            </a>
          </li>
          <li>
            <a href="#projects" className={styles.mobileMenuLink} onClick={closeMenu}>
              Projects
            </a>
          </li>
          <li>
            <a href="#education" className={styles.mobileMenuLink} onClick={closeMenu}>
              Education
            </a>
          </li>
          <li>
            <a href="#achievements" className={styles.mobileMenuLink} onClick={closeMenu}>
              Achievements
            </a>
          </li>
          <li>
            <a href="#certifications" className={styles.mobileMenuLink} onClick={closeMenu}>
              Certifications
            </a>
          </li>
          {resumeUrl && resumeUrl !== '#' && (
            <li>
              <a href="#resume" className={styles.mobileMenuLink} onClick={closeMenu}>
                Resume
              </a>
            </li>
          )}
          <li>
            <a href="#contact" className={styles.mobileMenuLink} onClick={closeMenu}>
              Contact
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
