import { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/auth";

const USER_STORAGE_KEY = "@MyApp:userglowapp"; 

export function useUserAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = () => {
      if (typeof window !== "undefined") { // Verifica se o código está no lado do cliente
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        setLoading(false);
      }
    };

    const subscriber = firebase.auth().onAuthStateChanged(async (authUser) => {
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
