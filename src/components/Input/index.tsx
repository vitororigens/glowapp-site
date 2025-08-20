import React, { useState } from "react";
import { Button, Container, InputContainer } from "./styles";
import { FaEye, FaPlusCircle, FaSearch } from "react-icons/fa";

type InputProps = {
  placeholder: string;
  onChange?: (text: string) => void;  
  required?: boolean;
  passwordType?: boolean;
  showSearch?: boolean;
  showPlus?: boolean;
  onPress?: () => void;
  showIcon?: boolean;
  name?: string;
  value: string;
  type: 'PRIMARY' | 'SECONDARY' | 'TERTIARY';
  editable?: boolean;
};

export const Input: React.FC<InputProps> = ({
  placeholder,
  onChange,  
  value,
  showSearch = false,
  passwordType = false,
  showIcon = false,
  name,
  type,
  showPlus = false,
  onPress,
  editable = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value); 
    }
  };

  return (
    <Container $type={type}>
      {showIcon && <FaSearch style={{ fontSize: 16, color: "gray" }} />}
      <InputContainer
        placeholder={placeholder}
        onChange={(e) => handleChange(e)}  
        type={passwordType && !showPassword ? 'password' : 'text'}
        value={value}
        disabled={!editable} // Use 'disabled' instead of 'editable'
      />
      {passwordType && (
        <Button onClick={togglePasswordVisibility}>
           <FaEye style={{ fontSize: 16}} />
        </Button>
      )}
      {showSearch && (
        <Button onClick={onPress}>
           <FaSearch style={{ fontSize: 16, color: "gray" }} />
        </Button>
      )}
      {showPlus && (
        <Button onClick={onPress}>
            <FaPlusCircle style={{ fontSize: 16, color: "pink" }} />
        </Button>
      )}
    </Container>
  );
};
