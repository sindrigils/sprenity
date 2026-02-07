import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from 'react';
import { ConfigureAgentModal } from './configure-agent';
import type { CharacterModel } from '@core/hooks';
import { useInteractionStore } from '@core/store/interaction-store';

export type ModalType = 'configure-agent';

export interface ConfigureAgentData {
  agentId: string;
  name: string;
  model: string;
  characterModel: CharacterModel;
}

export type ModalData = {
  'configure-agent': ConfigureAgentData;
};

interface ModalContextValue {
  openModal: <T extends ModalType>(type: T, data: ModalData[T]) => void;
  closeModal: () => void;
  isModalOpen: boolean;
  activeModal: ModalType | null;
  modalData: ModalData[ModalType] | null;
}

const ModalContext = createContext<ModalContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}

interface ModalProviderProps {
  children: ReactNode;
  onSaveAgentConfig?: (
    agentId: string,
    data: { name: string; model: string; characterModel: CharacterModel }
  ) => void;
}

export function ModalProvider({
  children,
  onSaveAgentConfig,
}: ModalProviderProps) {
  const setLocked = useInteractionStore((state) => state.setLocked);
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [modalData, setModalData] = useState<ModalData[ModalType] | null>(null);

  const openModal = useCallback(
    <T extends ModalType>(type: T, data: ModalData[T]) => {
      setModalData(data);
      setActiveModal(type);
    },
    []
  );

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  const isModalOpen = activeModal !== null;

  useEffect(() => {
    setLocked(isModalOpen);
  }, [isModalOpen, setLocked]);

  return (
    <ModalContext.Provider
      value={{
        openModal,
        closeModal,
        isModalOpen,
        activeModal,
        modalData,
      }}
    >
      {children}
      {activeModal === 'configure-agent' && modalData && (
        <ConfigureAgentModal
          key={(modalData as ConfigureAgentData).agentId}
          isOpen={true}
          onClose={closeModal}
          onSave={(data) => {
            onSaveAgentConfig?.(
              (modalData as ConfigureAgentData).agentId,
              data
            );
            closeModal();
          }}
          initialName={(modalData as ConfigureAgentData).name}
          initialModel={(modalData as ConfigureAgentData).model}
          initialCharacterModel={(modalData as ConfigureAgentData).characterModel}
        />
      )}
    </ModalContext.Provider>
  );
}
