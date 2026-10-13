"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import keycloak from "../lib/keycloak";

type AuthContextValue = {
  authenticated: boolean;
  token: string | undefined;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
let initialization: Promise<boolean> | undefined;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string>();

  useEffect(() => {
    initialization ??= keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
    });

    initialization
      .then((isAuthenticated) => {
        console.log("Keycloak authenticated:", isAuthenticated);
        console.log("Keycloak issuer:", keycloak.authServerUrl);
        console.log("Keycloak realm:", keycloak.realm);
        console.log("Keycloak client:", keycloak.clientId);
        console.log("Keycloak token claims:", keycloak.tokenParsed);
        setAuthenticated(isAuthenticated);
        setToken(keycloak.token);
      })
      .catch((error) => {
        console.error("Keycloak initialization failed:", error);
      });
  }, []);

  const login = useCallback(() => {
    void keycloak.login({
      redirectUri: window.location.origin,
    });
  }, []);

  const logout = useCallback(() => {
    void keycloak.logout({
      redirectUri: window.location.origin,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
