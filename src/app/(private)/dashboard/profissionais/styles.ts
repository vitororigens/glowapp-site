import styled from "styled-components";


export const Container = styled.div`
  flex: 1;

  padding: 20px;
`;

export const ContentItems = styled.div`
  flex: 1;
  background-color: white;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 8px;
`;

export const Header = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 30px;
`;

export const ImageContainer = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #ddd;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const Title = styled.h2`
  font-size: 26px;
  color: gray;
`;

export const SubTitle = styled.p`
  font-size: 16px;
  
  color: gray;
`;

export const Items = styled.div`
  margin-bottom: 20px;
`;

export const ButtonItems = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  height: 50px;
  align-items: center;
  background: transparent;
  border: none;
`;


export const ContentSkeleton = styled.div`
  background: #f5f5f5;
  width: 100%;
  height: 60px;
  margin-bottom: 15px;
  border-radius: 8px;
  animation: skeletonLoading 1.5s infinite ease-in-out;
  @keyframes skeletonLoading {
    0% {
      background-color: #f5f5f5;
    }
    50% {
      background-color: #c9c9c9;
    }
    100% {
      background-color: #f5f5f5;
    }
  }
`;

