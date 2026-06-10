'use client';

import { useState } from 'react';
import { submitMessage } from '@/lib/supabase';
import styles from '@/app/page.module.css';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setStatus('error');
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setStatus('submitting');
    try {
      const response = await submitMessage(name, email, message);
      if (response.success) {
        setStatus('success');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
        setErrorMessage(response.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`${styles.contactForm} ${status === 'success' ? styles.formSuccess : ''}`}
    >
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.formLabel}>Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Name"
          className={styles.formInput}
          disabled={status === 'submitting'}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.formLabel}>Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="abc@gmail.com"
          className={styles.formInput}
          disabled={status === 'submitting'}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="message" className={styles.formLabel}>Message</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          placeholder="Tell me about your project..."
          rows={5}
          className={`${styles.formInput} ${styles.formTextarea}`}
          disabled={status === 'submitting'}
        />
      </div>

      <button
        type="submit"
        className={`${styles.submitButton} ${status === 'submitting' ? styles.submitButtonLoading : ''}`}
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? 'Sending...' : 'Send Message'}
      </button>

      {status === 'success' && (
        <div className={`${styles.alert} ${styles.alertSuccess}`} role="alert">
          <p>Submitted successfully</p>
        </div>
      )}

      {status === 'error' && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          <p>⚠️ {errorMessage}</p>
        </div>
      )}
    </form>
  );
}
