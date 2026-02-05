import React, { useState, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { useUser } from '../contexts/UserContext';
import styles from './LoginPage.module.scss';
import { Icon } from '@/components/Icons/AutoIcons';

interface SignUpPageProps {
  onShowLogin: () => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onShowLogin }) => {
  const { refreshUser } = useUser();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Signup failed');
      }
      console.log('Signup successful');

      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogIn = useCallback(() => onShowLogin(), [onShowLogin]);

  return (
    <div className='login-form offset'>
      <Icon
        name='Arrow'
        style={{ transform: 'rotate(180deg)', height: 40 }}
        onClick={handleLogIn}
      />
      <h1 className={styles['login-title']}>Sign Up</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        <input
          name='username'
          placeholder='Username'
          value={form.username}
          onChange={handleChange}
          required
        />

        <input
          name='email'
          type='email'
          placeholder='Email'
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name='password'
          type='password'
          placeholder='Password'
          value={form.password}
          onChange={handleChange}
          required
        />

        {error && <p className='error'>{error}</p>}

        <button
          disabled={loading}
          type='submit'
          className={styles['next-button']}
        >
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default SignUpPage;
