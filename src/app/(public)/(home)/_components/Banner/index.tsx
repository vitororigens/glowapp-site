"use client";

import {
  IconApple,
  IconBrandAndroid,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandWhatsapp,
} from "@tabler/icons-react";
import * as S from "./styles";
import { useRouter } from "next/navigation";
import BackgroundImage from './../../../../../../public/img/resource/background.png'

const Banner = () => {
  const router = useRouter();

  return (
    <S.Banner>
      <S.BannerContainer>
        {/* Aqui usa apenas o componente com a prop image */}
        <S.BannerImage image={BackgroundImage.src} />

       

        <S.BannerSocials>
          <div className="socials">
            <a target="_blank" rel="noopener noreferrer" href="https://wa.me/5566996315835">
              <IconBrandWhatsapp />
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.instagram.com/brokerx.app/profilecard/?igsh=cGRjcGVweXc0cTBi"
            >
              <IconBrandInstagram />
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.facebook.com/share/19MTVABLe2/"
            >
              <IconBrandFacebook />
            </a>
          </div>
        </S.BannerSocials>

        <S.BannerContentInner>
          <S.BannerTitle>Do antes ao depois </S.BannerTitle>
          <S.BannerHeading>
            Documente, <br />
            Organize e Compartilhe <br />
            <span>Suas Transformações </span>
          </S.BannerHeading>
          <S.BannerText>
          O GlowApp é uma plataforma digital inovadora, disponível em app e web, que revoluciona a organização diária de profissionais, especialmente aqueles que buscam otimizar seu tempo e melhorar a gestão do trabalho. 
          Com foco em facilitar a rotina, a plataforma permite que os usuários registrem fotos dos clientes no estilo "antes e depois",
           criando um portfólio visual completo e um histórico detalhado de todos os serviços realizados ao longo dos anos. 
          </S.BannerText>
          <S.ButtonWrapper>
            <button
              onClick={() => {
                router.push("/android-download");
              }}
            >
              <IconBrandAndroid />
              Android
            </button>
            <button
              onClick={() => {
                router.push("/iphone-download");
              }}
            >
              <IconApple />
              Iphone
            </button>
          </S.ButtonWrapper>
        </S.BannerContentInner>
      </S.BannerContainer>
    </S.Banner>
  );
};

export { Banner };
