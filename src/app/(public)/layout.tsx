"use client";

import { AuthProvider } from "@/context/AuthContext";
import StyledComponentsRegistry from "../registry";
import ClientOnly from "@/components/ClientOnly";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClientOnly>
      <AuthProvider>
        <StyledComponentsRegistry>
          <Header />
          {children}
          <Footer />
          <ToastContainer />
        </StyledComponentsRegistry>
      </AuthProvider>
    </ClientOnly>
  );
}
