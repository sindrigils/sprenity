import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

type TextTag =
  | 'span'
  | 'p'
  | 'div'
  | 'label'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: TextTag;
  size?: number;
  children: ReactNode;
}

export function Text({
  as = 'span',
  size = 16,
  style,
  children,
  ...props
}: TextProps) {
  const Component = as;
  const mergedStyle: CSSProperties = {
    fontSize: `${size}px`,
    ...style,
  };

  return (
    <Component style={mergedStyle} {...props}>
      {children}
    </Component>
  );
}
