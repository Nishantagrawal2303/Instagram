import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

 useEffect(() => {
  const checkAuth = () => {
    const hasAccessToken = document.cookie
      .split("; ")
      .some((cookie) => cookie.startsWith("accessToken="));

    setIsAuthenticated(hasAccessToken);
  };

  checkAuth();
}, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
      }}
    >
      {children}
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
