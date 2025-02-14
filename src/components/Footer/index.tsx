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
            <a href="/">Home</a>
            <a href="/contato">Contato</a>
            {user && <a href="/perfil">Perfil</a>}
            {user && <a href="/favoritos">Favoritos</a>}
            {!user && <a href="/auth/login">Login</a>}
          </S.NavigationWrapper>

          <S.ContactInformation>
            <h5 className="title">Informações de Contato</h5>
            {/* <div className="wrapper">
              <div className="icon">
                <IconMapPin />
              </div>
              1426 StreetBend,7702, <br />
              California, USA
            </div> */}
            <div className="wrapper">
              <div className="icon">
                <IconPhone />
              </div>
              <a target="_blank" rel="noopener noreferrer" href="tel:+55-61-996315835">996315835</a>
            </div>
            <div className="wrapper">
              <div className="icon">
                <IconMail />
              </div>
              <a target="_blank" rel="noopener noreferrer" href="mailto:contato@glowapp.com.br">contato@glowapp.com.br</a>
            </div>
          </S.ContactInformation>
        </S.FooterWrapper>

        <S.SocialWrapper>
          <div className="copyright">
            GlowApp@ - Todos os direitos reservados 
          </div>

          <div className="socials">
            <a target="_blank" rel="noopener noreferrer" href="https://wa.me/5566996315835">
              <IconBrandWhatsapp />
            </a>
            {/* <a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/brokerx.app/profilecard/?igsh=cGRjcGVweXc0cTBi">
              <IconBrandInstagram />
            </a>
            <a target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/share/19MTVABLe2/">
              <IconBrandFacebook />
            </a> */}
          </div>
        </S.SocialWrapper>
      </S.FooterContainer>
    </S.Footer>
  );
};

export { Footer };
