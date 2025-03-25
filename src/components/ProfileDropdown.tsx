"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/services/firebase";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import { getInitialNameLetters } from "@/utils/formater/get-inital-name-letter";
import { Home, LogOut, User } from "lucide-react";

export default function ProfileDropdown() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: userDatas } = useFirestoreCollection("Register");
  
  const utilsInfo = (userDatas || []).find(
    (item: any) => item.id === user?.uid
  );

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
        {utilsInfo?.imageUrl ? (
          <img
            src={utilsInfo.imageUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="bg-gray-500 w-full h-full object-cover flex items-center justify-center">
            <span className="font-bold text-white">
              {user?.displayName ? getInitialNameLetters(user.displayName) : "U"}
            </span>
          </div>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu">
            <a
              href="/dashboard/perfil"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              <User className="mr-2 h-4 w-4" />
              Perfil
            </a>
            <a
              href="/"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </a>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
              role="menuitem"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 