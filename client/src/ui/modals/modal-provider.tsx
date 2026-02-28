import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from 'react';
import { ConfigureAgentModal } from './configure-agent';
import {
  EditZoneProjectModal,
  type EditZoneProjectModalData,
  type EditZoneProjectModalSize,
} from './edit-zone-project';
import type { CharacterModel } from '@core/hooks';
import { useInteractionStore } from '@core/store/interaction-store';

export type ModalType = 'configure-agent' | 'edit-zone-project';

export interface ConfigureAgentData {
  agentId: string;
  name: string;
  model: string;
  characterModel: CharacterModel;
}

export interface EditZoneProjectData {
  zoneId: string;
  name: string;
  color: string;
  size?: EditZoneProjectModalSize;
}

export type ModalData = {
  'configure-agent': ConfigureAgentData;
  'edit-zone-project': EditZoneProjectData;
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
  onSaveZoneProject?: (zoneId: string, data: EditZoneProjectModalData) => void;
  onDeleteZoneProject?: (zoneId: string) => void;
}

export function ModalProvider({
  children,
  onSaveAgentConfig,
  onSaveZoneProject,
  onDeleteZoneProject,
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
      {activeModal === 'edit-zone-project' && modalData && (
        <EditZoneProjectModal
          key={(modalData as EditZoneProjectData).zoneId}
          isOpen={true}
          onClose={closeModal}
          onDone={(data) => {
            onSaveZoneProject?.((modalData as EditZoneProjectData).zoneId, data);
            closeModal();
          }}
          onDelete={() => {
            onDeleteZoneProject?.((modalData as EditZoneProjectData).zoneId);
            closeModal();
          }}
          size={(modalData as EditZoneProjectData).size}
          initialName={(modalData as EditZoneProjectData).name}
          initialColor={(modalData as EditZoneProjectData).color}
        />
      )}
    </ModalContext.Provider>
  );
}
