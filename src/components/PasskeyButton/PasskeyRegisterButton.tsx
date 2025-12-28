import { use } from 'react';
import { useUser } from '../../contexts/UserContext';
import styles from './PasskeyButton.module.scss';
import { Icon } from '../Icons/AutoIcons';

function base64UrlToUint8Array(base64UrlString: string) {
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

export default function PasskeyRegisterButton() {
  const { user } = useUser();
  const handleRegister = async () => {
    try {
      const startRes = await fetch('/api/passkey/register/start/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        console.error('Start registration error:', err);
        return;
      }

      const options = await startRes.json();
      console.log('Registration options:', options);
      const publicKey = {
        challenge: base64UrlToUint8Array(options.challenge),
        rp: options.rp,
        user: {
          id: base64UrlToUint8Array(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams,
        timeout: options.timeout || 60000,
        authenticatorSelection: options.authenticatorSelection,
        attestation: options.attestation || 'none',
      };

      const credential = (await navigator.credentials.create({
        publicKey,
      })) as PublicKeyCredential;

      const body = {
        id: credential.id,
        rawId: bufferToBase64Url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToBase64Url(
            (credential.response as AuthenticatorAttestationResponse)
              .clientDataJSON
          ),
          attestationObject: bufferToBase64Url(
            (credential.response as AuthenticatorAttestationResponse)
              .attestationObject
          ),
        },
      };

      const finishRes = await fetch('/api/passkey/register/finish/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!finishRes.ok) {
        const err = await finishRes.json();
        console.error('Finish registration error:', err);
        return;
      }

      const result = await finishRes.json();
      console.log('Passkey registered:', result);
    } catch (e) {
      console.error('Registration failed:', e);
    }
  };

  return (
    <button onClick={handleRegister} className={styles.passkeyButton}>
      <Icon name='Passkey' />
      Add Passkey
    </button>
  );
}
