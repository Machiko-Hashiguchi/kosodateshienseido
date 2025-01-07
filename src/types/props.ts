// types/props.ts
import type { HTMLAttributes, ReactNode } from 'react';
import type { 
  CardProps, 
  CardHeaderProps, 
  CardBodyProps, 
  CardFooterProps, 
  TypographyProps, 
  ButtonProps,
  AlertProps 
} from "@material-tailwind/react";

export interface BaseProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  placeholder?: string;
}

export type MaterialProps = 
  | CardProps 
  | CardHeaderProps 
  | CardBodyProps 
  | CardFooterProps 
  | TypographyProps 
  | ButtonProps 
  | AlertProps;

export type WithBaseProps<T extends MaterialProps> = T & BaseProps;