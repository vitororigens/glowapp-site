"use client";

import "../../styles/bootstrap.css";
import "../../styles/globals.css";
import "../../styles/global.css";
import "../../styles/style-theme.css";
import "../../styles/style-theme-responsive.css";

import { AuthProvider } from "@/context/AuthContext";
import StyledComponentsRegistry from "../registry";

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
    <AuthProvider>
      <StyledComponentsRegistry>
        <Header />
        {children}
        <Footer />
        <ToastContainer />
      </StyledComponentsRegistry>
    </AuthProvider>
  );
}
