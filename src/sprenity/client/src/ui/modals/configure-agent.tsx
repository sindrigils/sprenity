import { Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import * as THREE from 'three';
import type { CharacterModel } from '@core/hooks';
import { IconChevronDown, IconClose } from '@ui/icons';
import { AgentPreviewScene } from '@ui/previews/agent-preview';
import { useThreeViewRegistry } from '@ui/three-view-registry';

interface ConfigureAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; model: string; characterModel: CharacterModel }) => void;
  initialName?: string;
  initialModel?: string;
  initialCharacterModel?: CharacterModel;
}

const modelOptions = [
  { value: 'claude-sonnet', label: 'Claude Sonnet' },
  { value: 'claude-opus', label: 'Claude Opus' },
  { value: 'claude-haiku', label: 'Claude Haiku' },
];

const characterModelOptions: { value: CharacterModel; label: string }[] = [
  { value: 'Barbarian', label: 'Barbarian' },
  { value: 'Knight', label: 'Knight' },
  { value: 'Mage', label: 'Mage' },
  { value: 'Ranger', label: 'Ranger' },
  { value: 'Rogue', label: 'Rogue' },
  { value: 'Rogue_Hooded', label: 'Rogue (Hooded)' },
];

const tabs = ['General', 'Skills', 'MCPs', 'Subagents'] as const;
type Tab = (typeof tabs)[number];

export function ConfigureAgentModal({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialModel = 'claude-sonnet',
  initialCharacterModel = 'Ranger',
}: ConfigureAgentModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('General');
  const [name, setName] = useState(initialName);
  const [model, setModel] = useState(initialModel);
  const [characterModel, setCharacterModel] = useState<CharacterModel>(initialCharacterModel);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const closingRef = useRef(false);
  const { active: isLoadingPreview } = useProgress();
  const viewId = useId();
  const { registerView, updateView, unregisterView } = useThreeViewRegistry();
  const previewCamera = useMemo(() => {
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1, 4.5);
    camera.lookAt(0, 0.9, 0);
    return camera;
  }, []);
  const previewElement = useMemo(
    () => (
      <Suspense fallback={null}>
        <AgentPreviewScene model={characterModel} camera={previewCamera} />
      </Suspense>
    ),
    [characterModel, previewCamera]
  );
  const previewElementRef = useRef(previewElement);
  previewElementRef.current = previewElement;

  useEffect(() => {
    registerView({
      id: viewId,
      track: previewRef,
      element: previewElementRef.current,
      priority: 2,
      camera: previewCamera,
    });
    return () => unregisterView(viewId);
  }, [registerView, unregisterView, viewId, previewCamera]);

  useEffect(() => {
    updateView(viewId, {
      track: previewRef,
      element: previewElement,
      priority: 2,
      camera: previewCamera,
    });
  }, [updateView, viewId, previewElement, previewCamera]);

  if (!isOpen) return null;

  const queueClose = (finalize: () => void) => {
    if (closingRef.current) return;
    closingRef.current = true;
    updateView(viewId, { visible: false });
    requestAnimationFrame(() => {
      unregisterView(viewId);
      finalize();
    });
  };

  const handleClose = () => {
    queueClose(onClose);
  };

  const handleSave = () => {
    queueClose(() => onSave({ name, model, characterModel }));
  };

  return (
    <div
      data-testid="configure-agent-modal"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-transparent"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-[90vw] max-w-[1400px] bg-transparent rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[900px] min-h-[500px] border border-[#2a2b3d] overflow-hidden">
        {/* Header with tabs and close button */}
        <div className="flex items-center px-0 py-1.5 bg-[#151620]">
          <div className="flex items-center flex-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-colors border-none cursor-pointer text-center ${
                  activeTab === tab
                    ? 'text-green-300 shadow-[inset_0_-2px_0_0_rgba(134,239,172,1)]'
                    : 'text-gray-300/70 hover:text-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleClose}
          className="absolute right-4 top-3 p-2 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          aria-label="Close"
          data-testid="configure-agent-close"
        >
          <IconClose className="h-5 w-5" />
        </button>

        {/* Body with 30/70 split */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Agent Preview (35%) */}
          <div className="relative w-[35%] border-r border-[#2d2e3d]">
            <div ref={previewRef} className="h-full w-full" />
            {isLoadingPreview && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                Loading preview...
              </div>
            )}
          </div>

          {/* Right Panel - Form Content (70%) */}
          <div className="w-[65%] flex flex-col bg-[#171823]">
            {/* Content Area */}
            <div className="flex-1 p-10 flex flex-col gap-6 overflow-auto">
              {activeTab === 'General' && (
                <div className="flex flex-col gap-6 max-w-[560px]">
                  {/* Name Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-200">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-testid="configure-agent-name-input"
                      className="w-full px-4 py-3 bg-[#1c1d2b] border border-[#2a2b3d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
                      placeholder="Enter agent name"
                    />
                  </div>

                  {/* Model Dropdown */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-200">
                      Model
                    </label>
                    <div className="relative">
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        data-testid="configure-agent-model-select"
                        className="w-full px-4 py-3 pr-10 bg-[#1c1d2b] border border-[#2a2b3d] rounded-lg text-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/30 cursor-pointer appearance-none"
                      >
                        {modelOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <IconChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Character Model Dropdown */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-200">
                      Character
                    </label>
                    <div className="relative">
                      <select
                        value={characterModel}
                        onChange={(e) => setCharacterModel(e.target.value as CharacterModel)}
                        data-testid="configure-agent-character-select"
                        className="w-full px-4 py-3 pr-10 bg-[#1c1d2b] border border-[#2a2b3d] rounded-lg text-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/30 cursor-pointer appearance-none"
                      >
                        {characterModelOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <IconChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Skills' && (
                <div className="text-gray-400">
                  Skills configuration coming soon
                </div>
              )}

              {activeTab === 'MCPs' && (
                <div className="text-gray-400">
                  MCPs configuration coming soon
                </div>
              )}

              {activeTab === 'Subagents' && (
                <div className="text-gray-400">
                  Subagents configuration coming soon
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#2d2e3d] px-10 py-4 flex items-center justify-between bg-[#151620]">
              <div className="text-xs text-gray-400">
                Changes apply immediately to this agent.
              </div>
              <button
                onClick={handleSave}
                data-testid="configure-agent-save"
                className="px-4 py-2 bg-[#a8e063] text-black text-sm font-semibold rounded-lg hover:bg-[#9cd059] transition-colors border-none cursor-pointer shadow-[0_8px_16px_rgba(168,224,99,0.2)]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
