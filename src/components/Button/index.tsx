import { ButtonHTMLAttributes, HtmlHTMLAttributes, ReactNode } from "react"

import * as S from './styles';

type Props = {
  children: ReactNode
  isLoading?: boolean; 
} & ButtonHTMLAttributes<HTMLButtonElement>

const Button = ({
  children,
  isLoading,
  ...props
}: Props) => {
  return (
    <S.Button
      {...props}
      disabled={isLoading || props.disabled} // Desabilita quando carregando
      className={`${isLoading ? 'cursor-not-allowed opacity-50' : ''} ${props.className}`}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> // Spinner usando Tailwind
      ) : (
        children
      )}
    </S.Button>
  )
}

export { Button };
