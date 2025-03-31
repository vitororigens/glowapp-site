/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import { auth } from "@/services/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

import Cookies from "js-cookie";

type ContextTypes = {
  user: User | null;
};

const AuthContext = createContext<ContextTypes>({
  user: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const handleUser = (user: User | null) => {
      if (user) {
        setUser(user);
      } else {
        Cookies.remove("session");
      }
    };

    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within a AuthProvider");
  }
  return context;
};
