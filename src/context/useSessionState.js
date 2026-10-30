import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { useAuth } from './AuthContext';

const entries = new Map();
const listeners = new Set();
let session = 0;
export function clearSessionState() {
  session += 1;
  entries.clear();
  listeners.forEach(listener => listener());
}
// Memory only: never persist employee records or share them across accounts/roles.
export function useSessionState(name, initialValue) {
  const { user, role } = useAuth();
  const key = `${session}:${user?.uid || 'anonymous'}:${role}:${name}`;
  const initial = useRef(initialValue);
  const getSnapshot = useCallback(() => {
    if (!entries.has(key)) entries.set(key, typeof initial.current === 'function' ? initial.current() : initial.current);
    return entries.get(key);
  }, [key]);
  const subscribe = useCallback(listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const setValue = useCallback(update => {
    // Ignore completions from an account that has signed out.
    if (!key.startsWith(`${session}:`)) return;
    entries.set(key, typeof update === 'function' ? update(getSnapshot()) : update);
    listeners.forEach(listener => listener());
  }, [key, getSnapshot]);
  return [value, setValue];
}

export function useRefreshOnReturn(refresh) {
  const latest = useRef(refresh);
  latest.current = refresh;
  useEffect(() => {
    const run = () => { if (document.visibilityState === 'visible') latest.current(); };
    window.addEventListener('online', run);
    window.addEventListener('focus', run);
    return () => {
      window.removeEventListener('online', run);
      window.removeEventListener('focus', run);
    };
  }, []);
}
