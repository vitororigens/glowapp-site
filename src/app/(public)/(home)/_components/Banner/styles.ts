import styled from 'styled-components'
import imagebackground from './../../../../../../public/img/resource/background.png'
import { StaticImageData } from 'next/image';

export const Banner = styled.section`
  position: relative;
  z-index: 0;
`;
export const BannerContainer = styled.div`
  width: 80%;
  max-width: 1280px;
  margin: 0 auto;

  @media (max-width: 1080px) {
    width: 90%;
  }
`;
// 
export const BannerImage = styled.div<{ image?: string | StaticImageData }>`
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-image: ${({ image }) => 
  image ? (typeof image === "string" ? `url(${image})` : `url(${image.src})`) : "none"};


  &:before {
    position: absolute;
    content: '';
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    opacity: 0.8;
    background-color: var(--color-two);
  }
`;


export const BannerContentInner = styled.div`
  position: relative;
  padding-top: 220px;
  padding-bottom: 160px;

  @media (max-width: 1599px) {
    padding-top: 120px;
    padding-bottom: 50px;
  }
`;
export const BannerTitle = styled.div`
  position: relative;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  margin-bottom: 20px;
  display: inline-block;
  color: var(--main-color);
  text-transform: uppercase;

  &:before {
    position: absolute;
    content: '';
    left: 110%;
    top: 10px;
    height: 1px;
    width: 100px;
    background-color: var(--main-color);
  }

  @media (max-width: 1599px) {
    font-size: 14px;
  }
`;
export const BannerHeading = styled.h1`
  margin-bottom: 25px;
  color: var(--white-color);
  text-transform: uppercase;

  line-height: 1.2;
  font-weight: 700;
  font-size: 72px;

  span {
    position: relative;
    margin-left: 75px;
    color: var(--main-color);
  }

  @media (max-width: 1599px) {
    font-size: 54px;
  }
  @media (max-width: 1080px) {
    font-size: 34px;
    
    span {
      margin-left: 0px;
    }
  }
`;
export const BannerText = styled.p`
  position: relative;
  font-size: 16px;
  display: block;
  opacity: 0.75;
  line-height: 28px;
  max-width: 570px;
  margin-left: 75px;
  margin-bottom: 45px;
  color: var(--white-color);

  @media (max-width: 1599px) {
    font-size: 14px;
  }

  @media (max-width: 1080px) {
    margin: 30px 0;
  }
`;
export const BannerInfo = styled.div`
  position: absolute;
  left: -90px;
  top: 50%;
  z-index: 1;
  font-size: 14px;
  font-weight: 500;
  transform: rotate(-90deg);
  color: rgba(var(--white-color-rgb), 0.8);

  a {
    color: rgba(var(--white-color-rgb), 0.8);
  }

  a:hover {
    color: var(--main-color);
  }

  span {
    position: relative;
    margin-left: 20px;
    padding-left: 20px;

    &:before {
      position: absolute;
      content: '';
      left: -4px;
      top: 6px;
      width: 8px;
      height: 8px;
      border-radius: 50px;
      background-color: rgba(var(--white-color-rgb), 0.5);
    }
  }

  @media (max-width: 1080px) {
    display: none;
  }
`;
export const BannerSocials = styled.div`
  position: absolute;
  right: 30px;
  top: 50%;
  z-index: 10;
  width: 35px;
  transform: translateY(-50%);

  a {
    display: flex;
    align-items: center;
    justify-content: center;

    position: relative;
    width: 40px;
    height: 40px;
    font-size: 12px;
    margin: 6px 0;
    line-height: 28px;
    border-radius: 50px;
    color: var(--white-color);
    border: 1px solid rgba(var(--white-color-rgb), 0.3);
    transition: 400ms;

    svg{
      width: 60%;
      height: 60%;
    }
  }

  a:hover {
    color: var(--white-color);
    border-color: var(--main-color);
    background-color: var(--main-color);
  }

  @media (max-width: 1080px) {
    display: none;
  }
`;
//
export const ButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  button{
    position: relative;
    display: flex;
    flex-direction: column;
    text-align: start;
    gap: 15px;

    line-height: 1;
    cursor: pointer;
    font-weight: 500;
    padding: 20px 30px;
    min-width: 160px;
    font-size: 16px;
    transition: all 500ms ease;
    text-transform: capitalize;
    border-radius: 10px;
    background-color: rgba(var(--white-color-rgb), 0.2);
    color: rgba(var(--white-color-rgb), 0.80);

    &:hover{
      background-color: var(--main-color);
    }
  }

  @media (max-width: 1080px) {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 20px;

    button{
      min-width: 100%;
      padding: 10px;
    }
  }
`;

export const ImageSize = styled.img`

  border-top-left-radius: 20px;
  padding-top: 50px;
  padding-bottom: 10px;
   width: 100%;
   height: auto; /* Mantém a proporção da imagem */
   max-width: 100%;
  `;
