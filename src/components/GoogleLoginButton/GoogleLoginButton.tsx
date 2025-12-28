import { useEffect, useCallback } from 'react';
import { useUser } from '../../contexts/UserContext';

function GoogleLoginButton() {
  const { loginWithGoogle } = useUser();

  const handleCredentialResponse = useCallback(
    async (response: any) => {
      const id_token = response?.credential;
      if (!id_token) return;

      try {
        await loginWithGoogle(id_token);
      } catch (err) {
        console.error('Google login error', err);
      }
    },
    [loginWithGoogle]
  );

  useEffect(() => {
    const scriptId = 'google-client-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = scriptId;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const g = (window as any).google;
        if (g?.accounts?.id) {
          g.accounts.id.initialize({
            client_id:
              '661213065242-4dt9tro2q8iokcfbnof6m7r2g9th1qcc.apps.googleusercontent.com',
            callback: handleCredentialResponse,
            auto_select: false,
          });
          g.accounts.id.prompt();
        }
      };
      document.body.appendChild(script);
    }
  }, [handleCredentialResponse]);

  return null;
}

export default GoogleLoginButton;
