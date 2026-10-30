import { apiFetch as fetch } from './apiClient';
/**
 * Fetch an API resource with the signed-in user's Firebase ID token.
 *
 * Desktop sessions can outlive an ID token, so retry one unauthorized request
 * with a freshly issued token. The notification API requires this header for
 * reads as well as mutations.
 */
export async function fetchWithFirebaseAuth(user, url, options = {}) {
  if (!user) {
    throw new Error('You must be signed in to continue.');
  }

  const sendRequest = async (forceRefresh = false) => {
    const token = await user.getIdToken(forceRefresh);
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    return fetch(url, { ...options, headers });
  };

  let response = await sendRequest();

  if (response.status === 401) {
    response = await sendRequest(true);
  }

  return response;
}
