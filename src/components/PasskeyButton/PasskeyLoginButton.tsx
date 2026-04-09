function base64UrlToUint8Array(base64UrlString: string): ArrayBuffer {
  const base64 =
    base64UrlString.replace(/-/g, '+').replace(/_/g, '/') +
    '=='.slice(0, (4 - (base64UrlString.length % 4)) % 4);
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))).buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

import { useMemo } from 'react';
import { Icon } from '@/components/Icons/AutoIcons';
import { useUser } from '@/contexts/UserContextCore';

interface PasskeyLoginButtonProps {
  styles?: Record<string, string>;
}

export function PasskeyLoginButton({ styles }: PasskeyLoginButtonProps) {
  const { loginWithPasskey } = useUser();
  const passkeyIcon = useMemo(
    () => <Icon name='Passkey' className={styles?.['passkey-icon']} />,
    [styles],
  );
  const handleLogin = async () => {
    try {
      const startRes = await fetch('/api/passkey/auth/start/', {
        method: 'POST',
        credentials: 'include',
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        console.error('Auth start error:', err);
        return;
      }

      const options = await startRes.json();

      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge: base64UrlToUint8Array(options.challenge),
        rpId: options.rpId,
        allowCredentials:
          options.allowCredentials?.map((cred: Credential) => ({
            id: base64UrlToUint8Array(cred.id),
            type: 'public-key',
          })) || [],
        timeout: options.timeout || 60000,
        userVerification: 'preferred',
      };

      const assertion = (await navigator.credentials.get({
        publicKey,
      })) as PublicKeyCredential;

      const response = assertion.response as AuthenticatorAssertionResponse;

      const body = {
        id: assertion.id,
        rawId: bufferToBase64Url(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON: bufferToBase64Url(response.clientDataJSON),
          authenticatorData: bufferToBase64Url(response.authenticatorData),
          signature: bufferToBase64Url(response.signature),
          userHandle: response.userHandle
            ? bufferToBase64Url(response.userHandle)
            : undefined,
        },
      };

      try {
        await loginWithPasskey(body);
      } catch (e) {
        console.error('Passkey login failed:', e);
      }
    } catch (e) {
      console.error('Login failed:', e);
    }
  };

  return (
    <div onClick={handleLogin} className={styles?.['passkey-login-button']}>
      {passkeyIcon}
      Sign in with Passkey
    </div>
  );
}
