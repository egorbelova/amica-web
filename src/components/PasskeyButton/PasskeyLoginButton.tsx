function base64UrlToUint8Array(base64UrlString: string): Uint8Array {
  const base64 =
    base64UrlString.replace(/-/g, '+').replace(/_/g, '/') +
    '=='.slice(0, (4 - (base64UrlString.length % 4)) % 4);
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
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

import { Icon } from '@/components/Icons/AutoIcons';
import React from 'react';
interface PasskeyLoginButtonProps {
  styles?: React.CSSProperties;
}

export function PasskeyLoginButton({ styles }: PasskeyLoginButtonProps) {
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

      const publicKey: any = {
        challenge: base64UrlToUint8Array(options.challenge),
        rpId: options.rpId,
        allowCredentials:
          options.allowCredentials?.map((cred: any) => ({
            id: base64UrlToUint8Array(cred.id),
            type: 'public-key',
          })) || [],
        timeout: options.timeout || 60000,
        userVerification: 'preferred',
      };

      const assertion = (await navigator.credentials.get({
        publicKey,
      })) as PublicKeyCredential;

      const response = assertion.response as any;

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

      const finishRes = await fetch('/api/passkey/auth/finish/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (finishRes.ok) {
        const result = await finishRes.json();
        console.log('✅ Passkey login success:', result);
        window.location.reload();
      } else {
        const err = await finishRes.json();
        console.error('Auth finish error:', err);
      }
    } catch (e) {
      console.error('Login failed:', e);
    }
  };

  return (
    <div onClick={handleLogin} className={styles['passkey-login-button']}>
      <Icon name='Passkey' className={styles['passkey-icon']} />
      Passkey Login
    </div>
  );
}
