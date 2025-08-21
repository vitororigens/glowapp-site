"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/services/firebase";

import { useUserData } from "@/hooks/useUserData";

export default function ProfileDropdown() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const { userData: utilsInfo } = useUserData();

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
        className="flex rounded-full overflow-hidden bg-gray-100 shadow-sm h-10 w-10 sm:h-12 sm:w-12"
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
      >
        {utilsInfo?.imageUrl ? (
          <img
            src={utilsInfo.imageUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
            style={{ 
              objectFit: 'cover',
              objectPosition: 'center',
              width: '100%',
              height: '100%'
            }}
            onError={(e) => {
              console.log('Erro ao carregar imagem no ProfileDropdown:', e);
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
            <span className="text-gray-600 text-sm font-medium">
              {utilsInfo?.name
                ? utilsInfo.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : user?.displayName
                ? user.displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : user?.email
                ? user.email[0].toUpperCase()
                : "?"}
            </span>
          </div>
        )}
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
            <a
              href="/dashboard/planos"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Planos
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