import { useEffect, useState } from "react";
import { auth } from "@/services/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

const USER_STORAGE_KEY = "@MyApp:userglowapp"; 

export function useUserAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Só executar no lado do cliente
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const loadUserFromStorage = () => {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    const subscriber = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      setUser(authUser);
      setLoading(false);
    });

    loadUserFromStorage();

    return () => subscriber(); 
  }, []);

  useEffect(() => {
    if (user) {
      console.log("User ID:", user.uid);  
    }
  }, [user]);

  return { user, loading };
}
