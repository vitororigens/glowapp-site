import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: rgba(43, 44, 44, 0.9);
  padding: 20px;
  border-radius: 8px;
`;

export const ContainerItem = styled.div`
  width: 100%;
  border-radius: 5px;
  display: flex;
  flex-direction: row;
  height: 70px;
  align-items: center;
  padding: 5px;
  background-color: white;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
`;

export const ContainerOptions = styled.div`
  min-width: 100px;
  max-width: 170px;
  border-radius: 5px;
  background-color: white;
  max-height: 200px;
  margin-top: 20px;
  padding: 10px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
`;

export const Title = styled.p`
  font-size: 16px;
  color: #6a1b9a;
  font-weight: bold;
  margin: 0;
`;

export const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  margin-bottom: 5px;
  border: 1px solid #6a1b9a;
  border-radius: 5px;
  padding: 5px;
  background: none;
  cursor: pointer;
  transition: 0.3s;

  &:hover {
    background: #f3e5f5;
  }
`;

export const Icon = styled.span`
  font-size: 24px;
  color: #6a1b9a;
  margin-right: 10px;
`;

export const ContainerIcon = styled.div`
  width: 50px;
  height: 50px;
  background-color: #bdbdbd;
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
`;

export const ContainerImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50px;
  margin-right: 20px;
  object-fit: cover;
`;
