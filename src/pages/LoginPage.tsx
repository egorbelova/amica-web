import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LoginPage.css';
import GoogleLoginButton from '../components/GoogleLoginButton/GoogleLoginButton';
import { PasskeyLoginButton } from '../components/PasskeyButton/PasskeyLoginButton';
import { useUser } from '../contexts/UserContext';

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginPageProps {
  onShowSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onShowSignup }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const { loginWithPassword, loading } = useUser();

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (error) setError('');
    },
    [error]
  );

  const handleLogin = async () => {
    try {
      await loginWithPassword(formData.username, formData.password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleLogin();
    },
    [handleLogin]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (e.currentTarget === passwordRef.current) handleLogin();
        else if (e.currentTarget === usernameRef.current)
          passwordRef.current?.focus();
      }
    },
    [handleLogin]
  );

  const handleSignUp = useCallback(() => onShowSignup(), [onShowSignup]);

  return (
    <form className='login-form offset' onSubmit={handleSubmit} noValidate>
      <h4 className='registration_form'>Log In</h4>
      <fieldset className='form'>
        <legend className='form-label'>Username</legend>
        <input
          ref={usernameRef}
          name='username'
          value={formData.username}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={loading}
          autoComplete='username'
          required
        />
      </fieldset>
      <fieldset className='form'>
        <legend className='form-label'>Password</legend>
        <input
          ref={passwordRef}
          type='password'
          name='password'
          value={formData.password}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={loading}
          autoComplete='current-password'
          required
        />
      </fieldset>
      {error && <div style={{ color: 'red', margin: '8px 0' }}>{error}</div>}
      <button
        type='submit'
        className='next_button controls'
        disabled={loading || !formData.username || !formData.password}
      >
        {loading ? 'Logging in...' : 'Next'}
      </button>
      <div className='OR_div'>
        <span className='OR'>OR</span>
      </div>
      <GoogleLoginButton />
      <PasskeyLoginButton />
      Need an account?{' '}
      <a className='controls' onClick={handleSignUp}>
        Sign Up
      </a>
    </form>
  );
};

export default LoginPage;
