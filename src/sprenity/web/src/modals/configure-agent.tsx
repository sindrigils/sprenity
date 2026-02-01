import { Suspense, useState } from 'react';
import { AgentPreview } from '@components/agent-preview';
import type { CharacterModel } from '@hooks/index';

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

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ name, model, characterModel });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-[90vw] max-w-[1400px] bg-[#171823] rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[900px] min-h-[500px] border border-[#2a2b3d] overflow-hidden">
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
          onClick={onClose}
          className="absolute right-4 top-3 p-2 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Body with 30/70 split */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Agent Preview (35%) */}
          <div className="w-[35%] bg-[#141521] border-r border-[#2d2e3d]">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  Loading preview...
                </div>
              }
            >
              <AgentPreview model={characterModel} />
            </Suspense>
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
                        className="w-full px-4 py-3 pr-10 bg-[#1c1d2b] border border-[#2a2b3d] rounded-lg text-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/30 cursor-pointer appearance-none"
                      >
                        {modelOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.19l3.71-3.96a.75.75 0 111.08 1.04l-4.25 4.53a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
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
                        className="w-full px-4 py-3 pr-10 bg-[#1c1d2b] border border-[#2a2b3d] rounded-lg text-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/30 cursor-pointer appearance-none"
                      >
                        {characterModelOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.19l3.71-3.96a.75.75 0 111.08 1.04l-4.25 4.53a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
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
