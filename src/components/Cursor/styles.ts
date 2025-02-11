import styled from "styled-components";

export const CursorWrapper = styled.div`
  position: fixed;
  background-color: var(--main-color);
  width: 10px;
  height: 10px;
  border-radius: 100%;
  z-index: 1;
  -webkit-transition: 0.2s cubic-bezier(0.75, -0.27, 0.3, 1.33) opacity, 0.3s cubic-bezier(0.75, -1.27, 0.3, 2.33) -webkit-transform;
  transition: 0.2s cubic-bezier(0.75, -0.27, 0.3, 1.33) opacity, 0.3s cubic-bezier(0.75, -1.27, 0.3, 2.33) -webkit-transform;
  transition: 0.3s cubic-bezier(0.75, -1.27, 0.3, 2.33) transform, 0.2s cubic-bezier(0.75, -0.27, 0.3, 1.33) opacity;
  transition: 0.3s cubic-bezier(0.75, -1.27, 0.3, 2.33) transform, 0.2s cubic-bezier(0.75, -0.27, 0.3, 1.33) opacity, 0.3s cubic-bezier(0.75, -1.27, 0.3, 2.33) -webkit-transform;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	pointer-events: none;
	z-index: 10000;
	-webkit-transform: scale(1);
	transform: scale(1);

  &.active,
  &.menu-active{
    opacity: 1;
    -webkit-transform: scale(0);
    transform: scale(0);
  }

  &.hovered{
    opacity: 1;
  }

  ~ .cursor-follower {
    position: fixed;
    border: 0.5px solid var(--main-color);
    width: 30px;
    height: 30px;
    border-radius: 100%;
    z-index: 1;
    -webkit-transition: 0.2s cubic-bezier(0.75, -0.27, 0.3, 1.33) opacity, 0.2s cubic-bezier(0.75, -0.27, 0.3, 1.33) background, 0.6s cubic-bezier(0.75, -1.27, 0.3, 2.33) -webkit-transform;
    transition: 0.2s cubic-bezier(0.75, -0.27, 0.3, 1.33) opacity, 0.2s cubic-bezier(0.75, -0.27, 0.3, 1.33) background, 0.6s cubic-bezier(0.75, -1.27, 0.3, 2.33) -webkit-transform;
    transition: 0.6s cubic-bezier(0.75, -1.27, 0.3, 2.33) transform, 0.2s cubic-bezier(0.75, -0.27, 0.3, 1.33) opacity, 0.2s cubic-bezier(0.75, -0.27, 0.3, 1.33) background;
    transition: 0.6s cubic-bezier(0.75, -1.27, 0.3, 2.33) transform, 0.2s cubic-bezier(0.75, -0.27, 0.3, 1.33) opacity, 0.2s cubic-bezier(0.75, -0.27, 0.3, 1.33) background, 0.6s cubic-bezier(0.75, -1.27, 0.3, 2.33) -webkit-transform;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    pointer-events: none;
    z-index: 10000;
    -webkit-transform: translate(2px, 2px);
    transform: translate(2px, 2px);
  }

  ~ .cursor-follower.active {
    opacity: 0;
  }

  ~ .cursor-follower.menu-active {
    opacity: 0;
  }

  ~ .cursor-follower.hovered {
    opacity: 1;
  }

  @media (max-width: 1080px) {
    display: none !important;

    & ~ .cursor-follower.hovered {
      display: none !important;
    }
  }
`;