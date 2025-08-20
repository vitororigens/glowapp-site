"use client";

import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconMail,
  IconMapPin,
  IconPhone,
} from "@tabler/icons-react";

import * as S from "./styles";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";

const Footer = () => {
  const { user } = useAuthContext();

  return (
    <S.Footer>
      <S.FooterContainer>
        <S.FooterWrapper>
          <div className="flex flex-column">
            <S.Logo href="/">
              <img src="/img/logos/main-logo.png" alt="Logo" />
            </S.Logo>
          </div>

          <S.NavigationWrapper>
            <h5 className="title">Navegue</h5>
            <Link href="/">Home</Link>
            <Link href="/contato">Contato</Link>
            {user && <Link href="/perfil">Perfil</Link>}
            {user && <Link href="/favoritos">Favoritos</Link>}
            {!user && <Link href="/auth/login">Login</Link>}
            <Link href="/privacy-policy">Política de Privacidade</Link>
          </S.NavigationWrapper>

          <S.ContactInformation>
            <h5 className="title">Informações de Contato</h5>
            <div className="wrapper">
              <div className="icon">
                <IconMapPin />
              </div>
              <span>Brasil</span>
            </div>
          </S.ContactInformation>
        </S.FooterWrapper>

        <S.SocialWrapper>
          <div className="copyright">
            GlowApp@ - Todos os direitos reservados |  
            <Link href="/privacy-policy"> Política de Privacidade</Link> 
          </div>

          <div className="socials">
            <a target="_blank" rel="noopener noreferrer" href="https://wa.me/5566996315835">
              <IconBrandWhatsapp />
            </a>
          </div>
        </S.SocialWrapper>
      </S.FooterContainer>
    </S.Footer>
  );
};

export { Footer };
