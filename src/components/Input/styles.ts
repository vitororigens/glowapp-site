import styled from "styled-components";

type InputTypeProps = "PRIMARY" | "SECONDARY" | "TERTIARY";

type Props = {
  $type: InputTypeProps;
};

export const Container = styled.div<Props>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  max-height: 100px;
  gap: 0px;
  background-color: white;
  border-radius: ${({ $type }) => ($type === "PRIMARY" ? "8px" : "4px")};
  & > button {
    margin-left: 10px;
  }
`;

export const InputContainer = styled.input`
  flex: 1;
  height: 40px;
  width: 100%;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: white;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
  transition: border 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

  &::placeholder {
    color: #a1a1a1;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const Button = styled.button`
  background: none;
  border: none;
  cursor: pointer;
`;
