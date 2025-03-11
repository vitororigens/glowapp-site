import styled from "styled-components";
import { FaSearch, FaEye, FaEyeSlash, FaPlusCircle } from 'react-icons/fa';

type InputTypeProps = 'PRIMARY' | 'SECONDARY' | 'TERTIARY';

type Props = {
  type: InputTypeProps;
};

export const Container = styled.div<Props>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  max-height: 100px;
  padding: 16px;
  background-color: white;
  margin-bottom: 5px;
  border-radius: ${({ type }) => type === 'PRIMARY' ? '8px' : '4px'};
  border: 1px solid ;

  & > button {
    margin-left: 10px;
  }
`;

export const InputContainer = styled.input`
  flex: 1;
  height: 60px;
  color: gray;
 
  font-size: 16px;
  padding: 15px;
  border: none;
  outline: none;
  border-radius: 4px;
`;

export const Button = styled.button`
  background: none;
  border: none;
  cursor: pointer;
`;

