import { createContext, useContext, useEffect, useState } from "react";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../Config";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    const handleAuthState = async (currentUser) => {
      try {
        if (currentUser) {
          // User is signed in
          setUser(currentUser);

          // Fetch user role from Firestore
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            setRole(userData.role || "Employee");
          } else {
            setRole("Employee"); // Default role if user document doesn't exist
          }
        } else {
          // User is signed out
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setUser(null);
        setRole(null);
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
    // Helper to check if user is authenticated
    isAuthenticated: !!user,
    // Helper to check if user has admin role
    isAdmin: role === "Admin",
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