"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/services/firebase";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function ProfileDropdown() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [showDropdown, setShowDropdown] = useState(false);

  // Atualiza o contexto do usuário ao receber o evento customizado
  useEffect(() => {
    const handler = () => {
      if (auth.currentUser) {
        auth.currentUser.reload();
      }
    };
    window.addEventListener('authUserUpdated', handler);
    return () => window.removeEventListener('authUserUpdated', handler);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <div className="relative profile-dropdown">
      <button
        type="button"
        className="flex rounded-full overflow-hidden bg-gray-100 shadow-sm h-[48px] w-[48px]"
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
      >
        <Avatar className="h-12 w-12">
          <AvatarImage src={user?.photoURL || undefined} />
          <AvatarFallback>
            {user?.displayName
              ? user.displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : user?.email
              ? user.email[0].toUpperCase()
              : "?"}
          </AvatarFallback>
        </Avatar>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <a
              href="/dashboard"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </a>
            <a
              href="/dashboard/perfil"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Perfil
            </a>
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 