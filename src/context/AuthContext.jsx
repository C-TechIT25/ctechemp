import { resetApiRequests } from '../utils/apiClient';
import { clearSessionState } from './useSessionState';
import { createContext, useContext, useEffect, useState } from "react";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../Config";
import {
  clearAuthDetails,
  getStoredAuthDetails,
  saveAuthDetails,
} from "../utils/authStorage";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authDetails, setAuthDetails] = useState(() => getStoredAuthDetails());

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    let previousUid;
    const handleAuthState = async (currentUser) => {
      if (previousUid !== currentUser?.uid) {
        clearSessionState();
        resetApiRequests();
      }
      previousUid = currentUser?.uid;
      try {
        if (currentUser) {
          // User is signed in
          setUser(currentUser);

          // Fetch user role from Firestore
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};
          const nextDetails = {
            role: userData.role || "Employee",
            status: userData.status || "active",
          };

          if (nextDetails.status === "inactive") {
            setUser(null);
            setRole(null);
            clearAuthDetails();
            setAuthDetails(null);
            await signOut(auth);
            return;
          }

          setRole(nextDetails.role);
          saveAuthDetails(currentUser, nextDetails);
          setAuthDetails(getStoredAuthDetails());
        } else {
          // User is signed out
          setUser(null);
          setRole(null);
          clearAuthDetails();
          setAuthDetails(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);

        // A profile/role lookup failure must not turn a valid Firebase session
        // into a logged-out session. Default to the least-privileged role.
        if (currentUser) {
          const fallbackDetails = { role: "Employee", status: "active" };
          setUser(currentUser);
          setRole(fallbackDetails.role);
          saveAuthDetails(currentUser, fallbackDetails);
          setAuthDetails(getStoredAuthDetails());
        } else {
          setUser(null);
          setRole(null);
          clearAuthDetails();
          setAuthDetails(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    const initializeAuthPersistence = async () => {
      try {
        // Keep the Firebase session after the desktop app/browser is closed.
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error("Error setting auth persistence:", error);
      }

      if (!isMounted) return;

      // Set up the auth state listener after persistence is configured.
      unsubscribe = onAuthStateChanged(auth, handleAuthState);
    };

    initializeAuthPersistence();

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Value object to be provided to consumers
  const value = {
    user,
    role,
    loading,
    authInitialized,
    authDetails,
    // Helper to check if user is authenticated
    isAuthenticated: !!user,
    // Helper to check if user has admin role
    isAdmin: ["Admin", "SuperAdmin"].includes(role),
    // Helper to check specifically for the super admin role
    isSuperAdmin: role === "SuperAdmin",
    // Helper to check if user has team lead role
    isTeamLead: role === "TeamLead",
    // Helper to check if user is employee
    isEmployee: role === "Employee",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
