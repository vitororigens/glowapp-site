import Link from 'next/link';
import styled from 'styled-components';

export const HeaderContainer = styled.header`
  position: fixed;
  left: 0px;
  top: 0px;
  right: 0px;

  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 20px;

  background-color: white;

  padding: 10px 5vw;
  z-index: 1000;

  @media (max-width: 1080px) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0;
  }
`;
// 
export const Logo = styled(Link)`
  img {
    max-width: 150px;
  }
`;
// 
export const Navbar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background-color: rgba(var(--black-color-rgb), 0.09);
  padding: 10px 30px;
  border-radius: 100px;
  justify-self: center;

  a{
    font-weight: 500;
    color: var(--black-color );
    font-size: 16px;
    transition: 400ms;

    &:hover{
      color: var(--main-color);
    }
  }

  @media (max-width: 1080px) {
    flex-direction: column;
    margin: auto 0;
    background-color: transparent;
    align-items: start;
    gap: 0px;
    margin-top: 40px;
    padding: 0px;

    a, button{
      font-size: 20px;
      padding: 10px 30px;
      width: 100%;
      font-weight: 400;
      text-align: start;
      color: var(--black-color);
      border-bottom: 1px solid #dddddd;
    }
  }
`;
// 
export const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
  min-width: 120px;
  justify-self: end;
`;
export const ActionsBtn = styled(Link)`
  position: relative;
  font-weight: 600;
  font-size: 16px;
  overflow: hidden;
  text-align: center;
  border-radius: 50px;
  padding: 10px 35px;
  display: inline-block;
  color: var(--black-color);
  text-transform: capitalize;
  background-color: var(--main-color);
`;
export const ActionsLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;

  width: 48px;
  height: 48px;
  font-size: 18px;
  cursor: pointer;
  border-radius: 50px;

  transition: all 500ms ease;
  -moz-transition: all 500ms ease;
  -webkit-transition: all 500ms ease;
  -ms-transition: all 500ms ease;
  -o-transition: all 500ms ease;

  color: var(--black-color);
  background-color: rgba(var(--black-color-rgb), 0.09);
  background-color: #333; /* Fundo sólido preto para os botões */

  &:hover{
    background-color: var(--main-color);
  }
`;
// 
export const MobileMenu = styled.div`
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  display: none !important;
  margin: 0 !important;
  padding: 0 !important;
  transform: none !important;

  &.active {
    display: block !important;
  }

  .menu-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
  }

  .menu-box {
    position: fixed;
    top: 0;
    right: 0;
    width: 300px;
    max-width: 85vw;
    height: 100%;
    background: #ffffff;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
  }

  .nav-logo {
    padding: 20px;
    border-bottom: 1px solid #eee;

    img {
      max-width: 200px;
    }
  }

  .close-btn {
    position: absolute;
    right: 15px;
    top: 15px;
    background: none;
    border: none;
    color: #202020;
    cursor: pointer;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 24px;
      height: 24px;
    }
  }
`;
export const OpenMenu = styled.button`
  display: flex;
  color: var(--black-color);

  svg {
    width: 40px;
    height: auto;
    object-fit: contain;
  }
`;
