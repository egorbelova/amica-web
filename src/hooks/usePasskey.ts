export const usePasskey = () => {
  const register = async (userEmail: string) => {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: { name: 'Your App', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(userEmail),
        name: userEmail,
        displayName: userEmail.split('@')[0],
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }], // ES256
      authenticatorSelection: { userVerification: 'required' },
      timeout: 60000,
    };

    const credential = (await navigator.credentials.create({
      publicKey,
    })) as PublicKeyCredential;
    return credential;
  };

  const authenticate = async () => {
    const challenge = new Uint8Array(32);
    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'required',
    };

    const credential = (await navigator.credentials.get({
      publicKey,
    })) as PublicKeyCredential;
    return credential.response;
  };

  return { register, authenticate };
};
