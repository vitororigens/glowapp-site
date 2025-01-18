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
import Head from "next/head";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <AuthProvider>
          <StyledComponentsRegistry>
            <Header />
            {children}
            <Footer />
            <ToastContainer />
          </StyledComponentsRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}
