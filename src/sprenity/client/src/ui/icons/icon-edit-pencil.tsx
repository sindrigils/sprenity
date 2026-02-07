import { BaseIcon } from './base';
import type { IconProps } from './base';

export function IconEditPencil(props: IconProps) {
  return (
    <BaseIcon stroke="currentColor" strokeWidth="2.2" {...props}>
      <path d="M3 21l3.7-.8L19 7.9a2.2 2.2 0 0 0-3.1-3.1L3.7 17.1 3 21z" />
      <path d="M14.3 6.4l3.2 3.2" />
    </BaseIcon>
  );
}
