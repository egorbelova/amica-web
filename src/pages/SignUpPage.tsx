import React, { useState } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { useUser } from '../contexts/UserContext';

const SignUpPage: React.FC = () => {
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
      const res = await apiFetch('/api/signup/', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Signup failed');
      }

      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='signup-container'>
      <h1>Sign Up</h1>

      <form onSubmit={handleSubmit}>
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

        <button disabled={loading}>
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default SignUpPage;
