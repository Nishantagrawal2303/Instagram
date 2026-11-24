import { createContext, useContext, useEffect, useState } from "react";
import AuthModal from "../components/auth/AuthModal";

type AuthContextType = {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  openAuthModal: (prompt?: string) => void;
  closeAuthModal: () => void;
  requireAuth: (callback: () => void, prompt?: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState<string | undefined>(undefined);

  useEffect(() => {
    const checkAuth = () => {
      const hasAccessToken = document.cookie
        .split("; ")
        .some((cookie) => cookie.startsWith("accessToken="));

      setIsAuthenticated(hasAccessToken);
    };

    checkAuth();
  }, []);

  const openAuthModal = (prompt?: string) => {
    setAuthPrompt(prompt);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthPrompt(undefined);
  };

  const requireAuth = (callback: () => void, prompt?: string) => {
    if (isAuthenticated) {
      callback();
    } else {
      openAuthModal(prompt);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        openAuthModal,
        closeAuthModal,
        requireAuth,
      }}
    >
      {children}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        prompt={authPrompt}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
