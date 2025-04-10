/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthContext } from "@/context/AuthContext";

import { useIsMobile } from "@/hooks/useMobileDevice";

import { signOut } from "firebase/auth";
import { auth } from "@/services/firebase";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";

import $ from "jquery";

import {
  IconHome,
  IconLogout,
  IconMenu3,
  IconUser,
  IconX,
} from "@tabler/icons-react";

import { Button } from "../Button";

import * as S from "./styles";
import { getInitialNameLetters } from "@/utils/formater/get-inital-name-letter";

interface UserData {
  id: string;
  imageUrl?: string;
  name?: string;
  email?: string;
}

const Header = () => {
  const { isMobile } = useIsMobile({ breakpoint: 1080 });

  const handleOpenMenu = () => {
    $(".mobile-menu").addClass("active");
    $(".btn-menu").addClass("active");
  };

  return (
    <S.HeaderContainer>
      <S.Logo href={"/"}>
        <img src="/img/logos/main-logo.png" alt="Logo" />
      </S.Logo>

      {!isMobile && (
        <>
          <S.Navbar>
            <a href="/">Home</a>
            <a href="/contact-us">Contato</a>
            <a href="/">Sobre</a>
          </S.Navbar>
          <ProfileDropdown />
        </>
      )}

      {isMobile && (
        <>
          <S.OpenMenu onClick={handleOpenMenu}>
            <IconMenu3 />
          </S.OpenMenu>

          <MenuMobile />
        </>
      )}
    </S.HeaderContainer>
  );
};

const MenuMobile = () => {
  const { user } = useAuthContext();
  const router = useRouter();

  const { data: userDatas } = useFirestoreCollection<UserData>("Register");
  const utilsInfo = (userDatas || []).find(
    (item) => item.id === user?.uid
  );

  const handleCloseMenu = () => {
    $(".mobile-menu").removeClass("active");
    $(".btn-menu").addClass("active");
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  return (
    <S.MobileMenu className="mobile-menu">
      <div className="menu-backdrop"></div>
      <button className="close-btn" onClick={handleCloseMenu}>
        <IconX />
      </button>

      <div className="menu-box">
        <div className="nav-logo">
          <img src="/img/logos/main-logo-2.png" alt="Logo" />
        </div>

        <div className="menu-outer">
          <S.Navbar>
            <a href="/">Home</a>
            <a href="/contact-us">Contato</a>
            <a href="/">Sobre</a>
            {user ? (
              <>
                <a href="/dashboard">Dashboard</a>
                <button onClick={handleSignOut}>Sair</button>
              </>
            ) : (
              <a href="/auth/login">Login</a>
            )}
          </S.Navbar>
        </div>
      </div>
    </S.MobileMenu>
  );
};

const ProfileDropdown = () => {
  const router = useRouter();
  const { user } = useAuthContext();
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: userDatas } = useFirestoreCollection<UserData>("Register");
  const utilsInfo = (userDatas || []).find(
    (item) => item.id === user?.uid
  );

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  return (
    <S.ActionsWrapper>
      {user ? (
        <div className="relative inline-block text-left">
          <button
            type="button"
            className="flex rounded-full overflow-hidden bg-white shadow-sm h-[48px] w-[48px]"
            onClick={() => {
              setShowDropdown((prev) => !prev);
            }}
          >
            {utilsInfo?.imageUrl ? (
              <img
                src={utilsInfo.imageUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                width={50}
                height={50}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-gray-600 text-lg font-medium">
                  {getInitialNameLetters(utilsInfo?.name || user.email || '')}
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
      ) : (
        <Button onClick={() => router.push("/auth/login")}>Login</Button>
      )}
    </S.ActionsWrapper>
  );
};

export default Header;
