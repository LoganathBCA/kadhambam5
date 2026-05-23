// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../firebase/auth';
import { saveUser } from '../services/userService';

const AuthContext = createContext(null);

// Admin check via UID (most secure) OR email fallback
const ADMIN_UIDS = (import.meta.env.VITE_ADMIN_UIDS || '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = Boolean(
    user &&
    (ADMIN_UIDS.includes(user.uid) || ADMIN_EMAILS.includes(user.email))
  );

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        try {
          await saveUser(firebaseUser.uid, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
          });
        } catch { /* silently fail if Firestore not configured yet */ }
      }
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
