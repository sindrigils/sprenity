import { BaseIcon } from './base';
import type { IconProps } from './base';

export function IconTrash(props: IconProps) {
  return (
    <BaseIcon stroke="currentColor" strokeWidth="2.2" {...props}>
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2z" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </BaseIcon>
  );
}
