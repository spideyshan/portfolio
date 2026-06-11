'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import styles from '../admin.module.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const router = useRouter();

  // 2-Step OTP Verification States
  const [loginStep, setLoginStep] = useState<'credentials' | 'otp'>('credentials');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Clear 2fa verification on load to enforce security
    localStorage.removeItem('portfolio_admin_2fa_verified');

    // Check if already logged in via Supabase
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          if (session && session.user?.email) {
            // User has valid password session but needs OTP verification
            const userEmail = session.user.email;
            setEmail(userEmail);
            setLoginStep('otp');
            sendOtpCode(userEmail);
          }
        })
        .catch((err) => {
          console.warn('Could not check Supabase auth session (offline?):', err);
        });
    } else {
      setIsDemo(true);
      // Check mock session
      const mockSession = localStorage.getItem('portfolio_mock_session');
      if (mockSession === 'true') {
        // If mock session exists but 2fa is not verified, require OTP verification
        setEmail('s89953287@gmail.com');
        setLoginStep('otp');
        sendOtpCode('s89953287@gmail.com');
      }
    }
  }, [router]);

  // Countdown timer effect for resending code
  useEffect(() => {
    if (loginStep === 'otp' && resendCountdown > 0) {
      const interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loginStep, resendCountdown]);

  // Request code from backend OTP API
  const sendOtpCode = async (targetEmail: string) => {
    setLoading(true);
    setStatus('submitting');
    setMessage('Sending security code...');
    setOtpDigits(['', '', '', '', '', '']);

    try {
      const response = await fetch('/api/admin/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          email: targetEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP code.');
      }

      setStatus('idle');
      setMessage('OTP security code sent to your email!');
      setLoginStep('otp');
      setResendCountdown(45); // Disable resend button for 45 seconds
      
      if (data.demoCode) {
        setReceivedOtp(data.demoCode); // Keep code for mock email sandbox UI
      } else {
        setReceivedOtp(null);
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'Failed to send security code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        // Password valid, proceed to OTP step!
        // To keep states clean, save mock credentials session temporarily
        localStorage.setItem('portfolio_mock_session', 'true');
        await sendOtpCode(email);
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
        // Password valid, proceed to OTP step!
        await sendOtpCode(email);
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');
    
    if (enteredOtp.length !== 6) {
      setStatus('error');
      setMessage('Please enter all 6 digits of the OTP code.');
      return;
    }

    setLoading(true);
    setStatus('submitting');
    setMessage('Verifying security code...');

    try {
      const response = await fetch('/api/admin/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify',
          email,
          otp: enteredOtp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP code.');
      }

      // Successful 2FA verification!
      localStorage.setItem('portfolio_admin_2fa_verified', 'true');
      setStatus('success');
      setMessage('Access granted! Redirecting...');
      setTimeout(() => {
        router.push('/admin');
      }, 800);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'OTP verification failed. Please try again.');
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next input box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Move focus back on delete key if empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedText)) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pastedText.length; i++) {
      newDigits[i] = pastedText[i];
    }
    setOtpDigits(newDigits);

    // Focus last active input
    const targetIdx = Math.min(pastedText.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  const handleBackToLogin = () => {
    // Reset mock session and 2fa states
    localStorage.removeItem('portfolio_mock_session');
    localStorage.removeItem('portfolio_admin_2fa_verified');
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setLoginStep('credentials');
    setStatus('idle');
    setMessage('');
    setOtpDigits(['', '', '', '', '', '']);
  };

  return (
    <div className={styles.loginWrapper}>
      <article className={styles.loginCard}>
        {loginStep === 'credentials' ? (
          // Credentials Phase
          <>
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
                {loading ? 'Validating...' : 'Sign In'}
              </button>
            </form>
          </>
        ) : (
          // OTP Code Phase
          <>
            <h1 className={styles.otpTitle}>Security Code</h1>
            <p className={styles.loginSubtitle}>
              Enter the 6-digit OTP code sent to <strong>{email}</strong>.
            </p>

            <form onSubmit={handleVerifyOtp} className={styles.loginForm}>
              <div className={styles.otpInputGroup} onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={styles.otpInputBox}
                    disabled={loading}
                    required
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              <button 
                type="submit" 
                className={styles.loginButton}
                disabled={loading || otpDigits.some(d => !d)}
              >
                {loading && status === 'submitting' ? 'Verifying...' : 'Verify & Proceed'}
              </button>

              <div className={styles.resendContainer}>
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className={styles.backBtn}
                  disabled={loading}
                >
                  ← Back to login
                </button>

                {resendCountdown > 0 ? (
                  <span>Resend code in {resendCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => sendOtpCode(email)}
                    className={styles.resendBtn}
                    disabled={loading}
                  >
                    Resend code
                  </button>
                )}
              </div>
            </form>

            {/* Premium Mailbox Sandbox UI for Testing Demo Mode */}
            {receivedOtp && (
              <div className={styles.mockMailboxCard} role="status">
                <div className={styles.mockMailboxHeader}>
                  <span>📧 Mock Inbox Notification</span>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>Just Now</span>
                </div>
                <div className={styles.mockMailboxBody}>
                  <p>To: <strong>{email}</strong></p>
                  <p>Subject: <strong>Your Portfolio Admin Access Code</strong></p>
                  <p style={{ marginBlockStart: '8px' }}>Use the security code below to complete sign-in:</p>
                  <span className={styles.mockMailboxCode}>{receivedOtp}</span>
                </div>
              </div>
            )}
          </>
        )}

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
