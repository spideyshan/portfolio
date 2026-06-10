'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import styles from '../admin.module.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in via Supabase
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.push('/admin');
        }
      });
    } else {
      setIsDemo(true);
      // Check mock session
      const mockSession = localStorage.getItem('portfolio_mock_session');
      if (mockSession === 'true') {
        router.push('/admin');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    if (isDemo) {
      // Mock Login validation
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API delay
      if (
        (email === 'admin@portfolio.com' && password === 'adminpass') ||
        (email === 's89953287@gmail.com' && password === 'spidey')
      ) {
        localStorage.setItem('portfolio_mock_session', 'true');
        setStatus('success');
        setMessage('Redirecting to demo dashboard...');
        setTimeout(() => {
          router.push('/admin');
        }, 800);
      } else {
        setLoading(false);
        setStatus('error');
        setMessage('Invalid mock credentials. (Use s89953287@gmail.com and password "spidey")');
      }
      return;
    }

    if (!supabase) return;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatus('error');
        setMessage(error.message);
        setLoading(false);
      } else if (data.session) {
        setStatus('success');
        setMessage('Successfully logged in! Redirecting...');
        setTimeout(() => {
          router.push('/admin');
        }, 800);
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <article className={styles.loginCard}>
        <h1 className={styles.loginTitle}>Admin Access</h1>
        <p className={styles.loginSubtitle}>
          {isDemo 
            ? 'Running in Demo Mode. Login below to preview the panel.' 
            : 'Sign in to manage your portfolio details.'}
        </p>

        {isDemo && (
          <div className={`${styles.alert} ${styles.alertInfo}`} role="status">
            💡 <strong>Demo Credentials:</strong><br />
            Email: <code>s89953287@gmail.com</code><br />
            Password: <code>spidey</code>
          </div>
        )}

        <form onSubmit={handleLogin} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@portfolio.com"
              className={styles.loginInput}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={styles.loginInput}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {status === 'success' && (
          <div className={`${styles.alert} ${styles.alertSuccess}`} style={{ marginTop: '1rem' }} role="status">
            {message}
          </div>
        )}

        {status === 'error' && (
          <div className={`${styles.alert} ${styles.alertError}`} style={{ marginTop: '1rem' }} role="alert">
            {message}
          </div>
        )}
      </article>
    </div>
  );
}
