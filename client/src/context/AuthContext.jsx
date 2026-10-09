import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { storage, STORAGE_KEYS } from "../utils/storage";
import { ROLES } from "../utils/constants";

export const AuthContext = createContext(null);

function getStoredUser() {
  const stored = storage.get(STORAGE_KEYS.user);
  const token = storage.get(STORAGE_KEYS.token);
  if (!stored && !token) return null;

  let role = stored?.role;
  let id = stored?.id;
  let email = stored?.email;
  let name = stored?.name;

  // If role is missing or corrupt, recover from JWT token payload
  if ((!role || role === "undefined") && token && typeof token === "string") {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.role) role = payload.role;
        if (payload.id) id = payload.id;
      }
    } catch {
      // ignore
    }
  }

  const normalizedRole = role ? String(role).toLowerCase() : ROLES.CITIZEN;

  if (!stored && token) {
    const recovered = {
      id,
      email: email || "",
      name: name || "User",
      role: normalizedRole,
    };
    storage.set(STORAGE_KEYS.user, recovered);
    return recovered;
  }

  if (stored) {
    const updated = {
      ...stored,
      role: normalizedRole,
    };
    if (stored.role !== normalizedRole) {
      storage.set(STORAGE_KEYS.user, updated);
    }
    return updated;
  }

  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  const login = useCallback(({ email, role = ROLES.CITIZEN, name, token }) => {
    const nextUser = {
      email,
      role: String(role).toLowerCase(),
      name: name ?? email?.split("@")[0] ?? "User",
    };
    storage.set(STORAGE_KEYS.user, nextUser);
    if (token) storage.set(STORAGE_KEYS.token, token);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    storage.remove(STORAGE_KEYS.user);
    storage.remove(STORAGE_KEYS.token);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ? String(user.role).toLowerCase() : null,
      isAuthenticated: Boolean(user && user.email),
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
