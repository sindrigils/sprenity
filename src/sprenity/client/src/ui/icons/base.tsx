import type { ReactNode, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

interface BaseIconProps extends IconProps {
  children: ReactNode;
}

export function BaseIcon({
  children,
  size = 24,
  width,
  height,
  viewBox = '0 0 24 24',
  fill = 'none',
  ...props
}: BaseIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size}
      height={height ?? size}
      viewBox={viewBox}
      fill={fill}
      {...props}
    >
      {children}
    </svg>
  );
}
