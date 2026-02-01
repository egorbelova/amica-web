import { useEffect, useCallback, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';

interface GooglePopupLoginButtonProps {
  className?: string;
}

function GooglePopupLoginButton({ className }: GooglePopupLoginButtonProps) {
  const { loginWithGoogle } = useUser();
  const tokenClientRef = useRef<any>(null);

  const handleCredentialResponse = useCallback(
    async (response: any) => {
      const access_token = response?.access_token;
      if (!access_token) return;

      try {
        console.log('Google access token:', access_token);
        await loginWithGoogle(access_token);
      } catch (err) {
        console.error('Google login error', err);
      }
    },
    [loginWithGoogle],
  );

  useEffect(() => {
    const scriptId = 'google-client-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.id = scriptId;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const g = (window as any).google;
      if (!g?.accounts?.oauth2) return;

      tokenClientRef.current = g.accounts.oauth2.initTokenClient({
        client_id:
          '661213065242-4dt9tro2q8iokcfbnof6m7r2g9th1qcc.apps.googleusercontent.com',
        scope: 'email profile openid',
        callback: handleCredentialResponse,
        hint: '',
      });
    };

    document.body.appendChild(script);
  }, [handleCredentialResponse]);

  const handleLogin = useCallback(() => {
    if (!tokenClientRef.current) return;
    tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
  }, []);

  return (
    <button onClick={handleLogin} type='button' className={className}>
      <img src='Images/64px-Google_Favicon_2025.svg (1).png' alt='Google' />
      Continue with Google
    </button>
  );
}

export default GooglePopupLoginButton;
