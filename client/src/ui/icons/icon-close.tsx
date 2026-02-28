import { BaseIcon } from './base';
import type { IconProps } from './base';

export function IconClose(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06z"
        clipRule="evenodd"
      />
    </BaseIcon>
  );
}
