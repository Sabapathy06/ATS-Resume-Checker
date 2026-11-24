export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '67170674379-014dcq046ssfjk840phcnh3cttl3e30r.apps.googleusercontent.com';

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  token: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (err: unknown) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve();
        } else if (attempts > 30) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error('Failed to load Google Sign-In library.'));
    document.head.appendChild(script);
  });
}

export async function requestGoogleSignIn(): Promise<GoogleUserProfile> {
  await loadGsiScript();

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Sign-In is unavailable. Please check your network or ad-blocker.');
  }

  return new Promise((resolve, reject) => {
    try {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error === 'access_denied' ? 'Sign-in was cancelled.' : tokenResponse.error));
            return;
          }
          if (!tokenResponse.access_token) {
            reject(new Error('No access token received from Google.'));
            return;
          }

          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            if (!res.ok) throw new Error('Could not retrieve user info from Google.');
            const info = await res.json();
            resolve({
              id: info.sub || `google_${Date.now()}`,
              email: info.email,
              name: info.name || info.given_name || info.email.split('@')[0],
              picture: info.picture,
              token: tokenResponse.access_token,
            });
          } catch (fetchErr) {
            reject(fetchErr instanceof Error ? fetchErr : new Error('Failed to fetch Google profile.'));
          }
        },
        error_callback: (err) => {
          reject(new Error('Google Account Chooser was closed or blocked.'));
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Failed to initiate Google sign-in.'));
    }
  });
}
