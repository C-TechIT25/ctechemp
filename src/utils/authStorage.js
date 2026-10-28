const AUTH_STORAGE_KEY = "ctech.auth.user";

const getStorage = () => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/**
 * Store only non-sensitive user details. Firebase owns the persisted login
 * credentials and ID-token lifecycle; passwords and tokens must never be
 * copied into localStorage.
 */
export function saveAuthDetails(user, profile = {}) {
  const storage = getStorage();
  if (!storage || !user?.uid) return;

  const authDetails = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    role: profile.role || "Employee",
    status: profile.status || "active",
    lastLoginAt: user.metadata?.lastSignInTime || new Date().toISOString(),
  };

  try {
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authDetails));
  } catch (error) {
    console.error("Unable to store auth details:", error);
  }
}

export function getStoredAuthDetails() {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const storedValue = storage.getItem(AUTH_STORAGE_KEY);
    if (!storedValue) return null;

    const authDetails = JSON.parse(storedValue);
    return authDetails?.uid ? authDetails : null;
  } catch (error) {
    console.error("Unable to read stored auth details:", error);
    return null;
  }
}

export function clearAuthDetails() {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error("Unable to clear stored auth details:", error);
  }
}

