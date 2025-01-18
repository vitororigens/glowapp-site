import Link from "next/link";
import styled from "styled-components";

export const Footer = styled.footer`
  background-color: var(--color-two);
  @media (max-width: 1080px) {
    margin-bottom: 10px;
    width: calc(100% - 20px);
  }
`;
export const FooterContainer = styled.div`
  width: 80%;
  max-width: 1280px;

  display: flex;
  flex-direction: column;
  gap: 50px;
  margin: 0px auto;
`;
// 
export const FooterWrapper = styled.div`
  margin-top: 60px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;

  @media (max-width: 1080px) {
    display: flex;
    flex-direction: column;
    gap: 50px;
  }
`;
// 
export const Logo = styled(Link)`
  img {
    max-width: 200px;
  }

  @media (max-width: 1080px) {
    img {
      max-width: 150px;
    }
  }
`;
export const NavigationWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  .title{
    font-weight:700;
    color: var(--white-color);
    text-transform: capitalize;
  }

  a{
    font-size: 16px;
    line-height: 1.3;
    color: rgba(var(--white-color-rgb), 0.70);
  }

  @media (max-width: 1080px) {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }
`;
export const ContactInformation = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  .title{
    font-weight:700;
    color: var(--white-color) !important;
    text-transform: capitalize;
  }
  .wrapper{
    display: flex;
    align-items: center;
    gap: 15px;

    font-size: 16px;
    line-height: 1.3;
    color: rgba(var(--white-color-rgb), 0.70) !important;
    
    a{
      color: rgba(var(--white-color-rgb), 0.70) !important;
    }
  }
  .icon{
    display: flex;
    align-items: center;
    justify-content: center;

    width: 40px;
    height: 40px;
    font-size: 18px;
    line-height: 38px;
    text-align: center;
    border-radius: 50px;

    color: var(--main-color);
    border: 1px dashed var(--main-color);
    background-color: rgba(var(--main-color-rgb), 0.10);
  }
`;
// 
export const SocialWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 30px;

  position:relative;
	padding:16px 0px;
	margin-bottom:20px;

  background-color: var(--color-nine);
  border-radius: 10px;
  justify-content: space-around;

  .copyright{
    font-size:16px;
    color: rgba(var(--color-eight-rgb), 0.70);

    a{
      color:var(--white-color);
    }
  }

  .socials{
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .socials a {
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


    &:hover {
      color: var(--white-color);
      border-color: var(--main-color);
      background-color: var(--main-color);
    }
  }

  @media (max-width: 1080px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    text-align: center;
    padding: 20px;
  }
`;
