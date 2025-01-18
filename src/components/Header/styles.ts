import Link from 'next/link';
import styled from 'styled-components';

export const HeaderContainer = styled.header`
  position: fixed;
  left: 0px;
  top: 0px;
  right: 0px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  background-color: rgba(var(--color-two-rgb), 1);

  padding: 10px 5vw;
  z-index: 1000;
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
  gap: 20px;
  background-color: rgba(var(--white-color-rgb), 0.08);
  padding: 10px 30px;
  border-radius: 100px;

  a{
    font-weight: 500;
    color: var(--white-color );
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
  gap: 20px;  
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
  color: var(--white-color);
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

  color: var(--white-color);
  background-color: rgba(var(--white-color-rgb), 0.08);

  &:hover{
    background-color: var(--main-color);
  }
`;
// 
export const MobileMenu = styled.div`
  position: fixed;
	right: 0;
	top: 0;
	width: 300px;
	padding-right:30px;
	max-width:100%;
	height: 100%;
	visibility: hidden;
	z-index: 99999999;

  &.active{
    visibility: visible;

    .menu-backdrop{
      opacity: 1;
      width:100%;
      visibility: visible;
      transition: all 900ms ease;
        -moz-transition: all 900ms ease;
        -webkit-transition: all 900ms ease;
        -ms-transition: all 900ms ease;
        -o-transition: all 900ms ease;
      -webkit-transform: translateX(0%);
      -ms-transform: translateX(0%);
      transform: translateX(0%);
    }
    .menu-box{
      right:0px;
      -webkit-transition-delay: 600ms;
      -moz-transition-delay: 600ms;
      -ms-transition-delay: 600ms;
      -o-transition-delay: 600ms;
      transition-delay: 600ms;
    }
    .close-btn{
      -webkit-transform: translateY(0px);
      -ms-transform: translateY(0px);
      transform: translateY(0px);
      -webkit-transition-delay: 900ms;
      -moz-transition-delay: 900ms;
      -ms-transition-delay: 900ms;
      -o-transition-delay: 900ms;
      transition-delay: 900ms;
    }
  }

  .menu-backdrop{
    position: fixed;
    right: 0;
    top: 0;
    width: 0%;
    height: 100%;
    z-index: 1;
    background: rgba(0,0,0,0.90);
    -webkit-transform: translateX(101%);
    -ms-transform: translateX(101%);
    transform: translateX(101%);
    transition: all 900ms ease;
      -moz-transition: all 900ms ease;
      -webkit-transition: all 900ms ease;
      -ms-transition: all 900ms ease;
      -o-transition: all 900ms ease;
    
    -webkit-transition-delay: 300ms;
    -moz-transition-delay: 300ms;
    -ms-transition-delay: 300ms;
    -o-transition-delay: 300ms;
    transition-delay: 300ms;
    z-index: 1;
  }

  .nav-logo{
    position:relative;
    padding:20px 20px;
    text-align:left;

    img{
      max-width:200px;
    }
  }

  .menu-box{
    position: absolute;
    right: -400px;
    top: 0px;
    width: 85vw;
    height: 100%;
    max-height: 100%;
    overflow-y: auto;
    background: #ffffff;
    padding: 0px 0px;
    z-index: 5;
    border-radius: 0px;
    
    transition: all 900ms ease;
    -moz-transition: all 900ms ease;
    -webkit-transition: all 900ms ease;
    -ms-transition: all 900ms ease;
    -o-transition: all 900ms ease;
  }

  .close-btn{
    position: absolute;
    right: 15px;
    top: 15px;

    color: #202020;
    cursor: pointer;

    -webkit-transition:all 0.5s ease;
    -moz-transition:all 0.5s ease;
    -ms-transition:all 0.5s ease;
    -o-transition:all 0.5s ease;
    transition:all 0.5s ease;
    -webkit-transform: translateY(-50%);
    -ms-transform: translateY(-50%);
    transform: translateY(-50%);

    z-index: 10;
  }
`;
export const OpenMenu = styled.button`
  display: flex;
  color: var(--white-color);

  svg {
    width: 40px;
    height: auto;
    object-fit: contain;
  }
`;
