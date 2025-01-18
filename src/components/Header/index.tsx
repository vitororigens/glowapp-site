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
            <a href="/contato">Contato</a>
            <a href="/imoveis">Sobre</a>
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

  const { data: userDatas } = useFirestoreCollection("Register");
  const utilsInfo = (userDatas || []).find(
    (item: any) => item.id === user?.uid
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
            <a href="/contato">Contato</a>
            <a href="/imoveis">Sobre</a>
            {user ? (
              <>
                <a href="/perfil">Perfil</a>
                {utilsInfo?.role === "broker" && (
                  <>
                    <a href="/meus-imoveis">Dashboard</a>
                  </>
                )}
                <a href="/favoritos">Favoritos</a>
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

  const { data: userDatas } = useFirestoreCollection("Register");
  const utilsInfo = (userDatas || []).find(
    (item: any) => item.id === user?.uid
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
                src={utilsInfo?.imageUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                width={50}
                height={50}
              />
            ) : (
              <div className="bg-gray-500 w-full h-full object-cover flex items-center justify-center">
                <span className="font-bold text-white">
                  {getInitialNameLetters(user.displayName)}
                </span>
              </div>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1" role="none">
                <a
                  href="/perfil"
                  className="block px-4 py-2 text-sm text-gray-700 flex flex-row gap-2"
                >
                  <IconUser />
                  Perfil
                </a>
                {utilsInfo?.role === "broker" && (
                  <>
                    <a
                      href="/meus-imoveis"
                      className="block px-4 py-2 text-sm text-gray-700 flex flex-row gap-2"
                    >
                      <IconHome />
                      Dashboard
                    </a>
                  </>
                )}
                <button
                  className="block px-4 py-2 text-sm text-gray-700 flex flex-row gap-2"
                  onClick={handleSignOut}
                >
                  <IconLogout />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <a href={"/auth/login"}>
          <Button>Login</Button>
        </a>
      )}
    </S.ActionsWrapper>
  );
};

export default Header;
