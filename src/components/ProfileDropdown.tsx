"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/services/firebase";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import { getInitialNameLetters } from "@/utils/formater/get-inital-name-letter";
import { Home, LogOut, User } from "lucide-react";

interface UserData {
  id: string;
  imageUrl?: string;
  name?: string;
  email?: string;
}

export default function ProfileDropdown() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: userDatas } = useFirestoreCollection<UserData>("Register");
  
  const utilsInfo = (userDatas || []).find(
    (item) => item.id === user?.uid
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
            width={48}
            height={48}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-600 text-lg font-medium">
              {getInitialNameLetters(utilsInfo?.name || user?.email || '')}
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
              href="/perfil"
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