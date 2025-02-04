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

        <S.BannerInfo>
          <a target="_blank" rel="noopener noreferrer" href="mailto:support@brokerz.com">
            support@brokerx.com
          </a>
          <span>
            <a target="_blank" rel="noopener noreferrer" href="tel:+55-61-996315835">
              996315835
            </a>
          </span>
        </S.BannerInfo>

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
          <S.BannerTitle>Antes e Depois</S.BannerTitle>
          <S.BannerHeading>
            Organize e<br />
            Impulsione Seus<br />
            <span>Negócios de Estética</span>
          </S.BannerHeading>
          <S.BannerText>
            Transforme a forma como você gerencia sua rotina com o aplicativo ideal para profissionais de
            estética. Agende atendimentos, organize seus serviços, controle suas finanças, e gerencie sua
            equipe com eficiência. Capture fotos de antes e depois, mantenha uma galeria exclusiva e
            compartilhe nas redes sociais com facilidade. Tudo o que você precisa para otimizar seu
            trabalho e conquistar seus clientes em um só lugar.
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
