import styled from "styled-components";
import { FaUserCircle, FaPlusCircle } from "react-icons/fa";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-grow: 1;
  padding: 20px;
  background-color: white;
`;

export const Content = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between; display: flex;
  flex-direction: column;
  width: 100%;
`;

export const Divider = styled.div`
  width: 98%;
  height: 1px;
  background-color: gray;
  margin: 10px;
`;

export const InputObservation = styled.textarea`
  min-height: 150px;
  max-height: 150px;
  color: gray;
  font-size: 16px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid gray;
  resize: none;
  margin: 20px;
`;

export const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  
`;


export const ContainerIcon = styled.button`
  height: 120px;
  width: 120px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: gray;
  border: none;
`;

export const Icon = styled(FaUserCircle)`
  color: white;
  font-size: 120px;
`;

export const IconPlus = styled(FaPlusCircle)`
  position: absolute;
  right: 5px;
  top: 0;
  color: pink;
  font-size: 32px;
`;

export const ContainerImage = styled.img`
  height: 120px;
  width: 120px;
  border-radius: 50%;
  object-fit: cover;
  background-color: gray;
`;

export const TextError = styled.span`
  font-size: 16px;
  color: red;
  text-align: center;
  align-self: flex-start;
  margin-top: 5px;
  margin-left: 10px;
`;

export const ImageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin: 20px 0;
`;

export const TextLabel = styled.textarea`

`;