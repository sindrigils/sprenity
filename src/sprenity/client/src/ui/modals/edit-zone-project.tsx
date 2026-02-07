import { useState } from 'react';
import { IconClose, IconEditPencil, IconTrash } from '@ui/icons';
import { Text } from '@ui/text';

export interface EditZoneProjectModalData {
  name: string;
  color: string;
}

export type EditZoneProjectModalSize = 'large' | 'small';

interface EditZoneProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDone: (data: EditZoneProjectModalData) => void;
  onDelete?: () => void;
  size?: EditZoneProjectModalSize;
  title?: string;
  initialName?: string;
  initialColor?: string;
}

const colorOptions = [
  '#98df7c',
  '#73d8d8',
  '#cf7bce',
  '#e2b087',
  '#8880e6',
  '#df8488',
] as const;

const modalSizeClasses: Record<EditZoneProjectModalSize, string> = {
  large: 'w-[90vw] md:w-[64vw] max-w-[680px]',
  small: 'w-[92vw] max-w-[560px]',
};

export function EditZoneProjectModal({
  isOpen,
  onClose,
  onDone,
  onDelete,
  size = 'large',
  title = 'Project Name',
  initialName = 'Project 21',
  initialColor = colorOptions[2],
}: EditZoneProjectModalProps) {
  const [name, setName] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState(initialColor);

  if (!isOpen) return null;

  const handleDone = () => onDone({ name, color: selectedColor });
  const handleDelete = () => {
    onDelete?.();
    if (!onDelete) onClose();
  };

  return (
    <div
      data-testid="edit-zone-project-modal"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />

      <div
        className={`relative z-10 overflow-hidden rounded-[22px] border border-[#26324b] bg-[#1c2435] shadow-[0_24px_64px_rgba(0,0,0,0.55)] ${modalSizeClasses[size]}`}
      >
        <div className="flex items-center justify-between px-5 pt-4 md:px-6 md:pt-5">
          <div className="flex items-center gap-3 leading-none text-[#edf0f6]">
            <IconEditPencil className="h-5 w-5 text-[#9ea6bc]" aria-hidden="true" />
            <Text as="h2" size={24} className="font-semibold">
              {title}
            </Text>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg border-none bg-transparent p-2 text-[#7e879e] transition-colors hover:text-[#c9d0dd] cursor-pointer"
            aria-label="Close"
            data-testid="edit-zone-project-close"
          >
            <IconClose className="h-8 w-8" />
          </button>
        </div>

        <div className="px-5 pb-4 pt-3 md:px-6 md:pb-5 md:pt-3">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            data-testid="edit-zone-project-name-input"
            className="h-[52px] w-full rounded-2xl border-2 border-[#6da667] bg-[#0d1322] px-4 text-[18px] font-semibold text-[#f4f7ff] outline-none placeholder:text-[#7f89a2] md:h-14 md:text-[20px]"
          />

          <div className="mt-4 md:mt-5">
            <Text as="p" size={20} className="font-semibold text-[#f2f5fb]">
              Color
            </Text>
            <div className="mt-3 flex flex-wrap items-center gap-1 md:mt-4 md:gap-1.5">
              {colorOptions.map((color) => {
                const isSelected = color === selectedColor;
                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    data-testid={`edit-zone-project-color-${color.replace('#', '')}`}
                    className={`rounded-[14px] border-none p-1.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#2f3a50]'
                        : 'bg-transparent hover:bg-[#273146]'
                    }`}
                    aria-label={`Select color ${color}`}
                  >
                    <span
                      className="block h-[38px] w-[38px] rounded-full md:h-[42px] md:w-[42px]"
                      style={{ backgroundColor: color }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 items-center border-t border-[#26324b] px-5 py-4 md:px-6 md:py-4">
          <div className="flex items-center justify-center">
            <button
              onClick={handleDelete}
              data-testid="edit-zone-project-delete"
              className="flex items-center gap-2.5 border-none bg-transparent text-[#ff6a72] transition-colors hover:text-[#ff8188] cursor-pointer"
            >
              <IconTrash className="h-5 w-5" aria-hidden="true" />
              <Text size={18} className="font-semibold">
                Delete
              </Text>
            </button>
          </div>

          <div className="flex items-center">
            <button
              onClick={handleDone}
              data-testid="edit-zone-project-done"
              className="w-full rounded-2xl border-none bg-[#98df7c] px-6 py-2 text-[#132117] transition-colors hover:bg-[#89ce6e] cursor-pointer md:px-8 md:py-2.5"
            >
              <Text size={19} className="font-medium">
                Done
              </Text>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
