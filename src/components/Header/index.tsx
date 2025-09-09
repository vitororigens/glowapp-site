/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthContext } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/useMobileDevice";
import { signOut } from "firebase/auth";
import { auth } from "@/services/firebase";
import { useUserData } from "@/hooks/useUserData";

import {
  IconMenu3,
  IconX,
} from "@tabler/icons-react";

import { Button } from "../Button";
import { getInitialNameLetters } from "@/utils/formater/get-inital-name-letter";

const Header = () => {
  const { isMobile } = useIsMobile({ breakpoint: 1080 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleOpenMenu = () => {
    setIsMobileMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Fechar menu quando mudar para desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  return (
    <header className="fixed left-0 top-0 right-0 z-50 bg-white shadow-md">
      <div className="flex items-center justify-between px-4 py-3 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex-shrink-0">
          <img src="/img/logos/main-logo.png" alt="Logo" className="h-8 lg:h-10" />
        </a>

        {/* Desktop Navigation */}
        {!isMobile && (
          <>
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="/" className="text-gray-700 hover:text-pink-500 transition-colors">
                Home
              </a>
              <a 
                href="#plans" 
                onClick={(e) => {
                  e.preventDefault();
                  const plansSection = document.getElementById('plans');
                  if (plansSection) {
                    const offset = 100;
                    const elementPosition = plansSection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }}
                className="text-gray-700 hover:text-pink-500 transition-colors"
              >
                Planos
              </a>
              <a 
                href="#contact" 
                onClick={(e) => {
                  e.preventDefault();
                  const contactSection = document.getElementById('contact');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-gray-700 hover:text-pink-500 transition-colors"
              >
                Contato
              </a>
              <a href="/" className="text-gray-700 hover:text-pink-500 transition-colors">
                Sobre
              </a>
            </nav>

            {/* Desktop Profile */}
            <div className="hidden lg:block">
              <ProfileDropdown />
            </div>
          </>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={handleOpenMenu}
            className="p-2 text-gray-700 hover:text-pink-500 transition-colors"
          >
            <IconMenu3 size={24} />
          </button>
        )}
      </div>

      {/* Mobile Menu Modal */}
      {isMobile && (
        <MobileMenuModal 
          isOpen={isMobileMenuOpen} 
          onClose={handleCloseMenu} 
        />
      )}
    </header>
  );
};

const MobileMenuModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user } = useAuthContext();
  const router = useRouter();
  const { userData: utilsInfo } = useUserData();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/auth/login");
    onClose();
  };

  const handleLinkClick = (callback?: () => void) => {
    if (callback) callback();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <img src="/img/logos/main-logo.png" alt="Logo" className="h-8" />
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <IconX size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <a 
            href="/" 
            onClick={() => handleLinkClick()}
            className="block py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Home
          </a>
          <a 
            href="#plans" 
            onClick={(e) => {
              e.preventDefault();
              const plansSection = document.getElementById('plans');
              if (plansSection) {
                const offset = 100;
                const elementPosition = plansSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
              }
              handleLinkClick();
            }}
            className="block py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Planos
          </a>
          <a 
            href="#contact" 
            onClick={(e) => {
              e.preventDefault();
              const contactSection = document.getElementById('contact');
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
              }
              handleLinkClick();
            }}
            className="block py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Contato
          </a>
          <a 
            href="/" 
            onClick={() => handleLinkClick()}
            className="block py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Sobre
          </a>
          
          {user ? (
            <>
              <a 
                href="/dashboard" 
                onClick={() => handleLinkClick()}
                className="block py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Dashboard
              </a>
              <button 
                onClick={handleSignOut}
                className="block w-full text-left py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <a 
              href="/auth/login" 
              onClick={() => handleLinkClick()}
              className="block py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Login
            </a>
          )}
        </nav>
      </div>
    </div>
  );
};

const ProfileDropdown = () => {
  const router = useRouter();
  const { user } = useAuthContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const { userData: utilsInfo } = useUserData();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  return (
    <div className="relative">
      {user ? (
        <div className="relative">
          <button
            type="button"
            className="flex rounded-full overflow-hidden bg-white shadow-sm h-10 w-10 sm:h-12 sm:w-12"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {utilsInfo?.imageUrl ? (
              <img
                src={utilsInfo.imageUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
                <span className="text-gray-600 text-sm font-medium">
                  {getInitialNameLetters(utilsInfo?.name || user?.displayName || user?.email || '')}
                </span>
              </div>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
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
      ) : (
        <Button onClick={() => router.push("/auth/login")}>Login</Button>
      )}
    </div>
  );
};

export default Header;
