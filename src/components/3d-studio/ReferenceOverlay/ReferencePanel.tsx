'use client';

import React, { useState } from 'react';
import { ReferenceState, ReferenceView } from '@/types/reference';

interface ReferencePanelProps {
  references: ReferenceState;
  onUpload: (view: ReferenceView, file: File) => void;
  onUpdate: (view: ReferenceView, key: string, value: number | boolean) => void;
}

export const ReferencePanel: React.FC<ReferencePanelProps> = ({
  references,
  onUpload,
  onUpdate,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const views: ReferenceView[] = ['front', 'side', 'top'];

  return (
    <div className="absolute right-4 top-4 z-20 flex items-start gap-2 select-none">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 p-2.5 rounded-xl backdrop-blur-md shadow-lg transition flex items-center justify-center text-xs font-medium"
        title={isOpen ? 'Collapse Panel' : 'Open Reference Panel'}
      >
        {isOpen ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>References</span>
          </div>
        )}
      </button>

      {/* Main Reference Overlay Drawer */}
      {isOpen && (
        <div className="w-80 bg-neutral-950/85 backdrop-blur-xl text-neutral-100 p-4 rounded-2xl border border-neutral-800/80 shadow-2xl transition-all animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-neutral-300">
                Backdrop Guides
              </h3>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">CAD OVERLAY</span>
          </div>

          <div className="space-y-3">
            {views.map((view) => {
              const item = references[view];
              return (
                <div
                  key={view}
                  className="p-3 bg-neutral-900/70 rounded-xl border border-neutral-800/60 hover:border-neutral-700/60 transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="capitalize text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500"></span>
                      {view} View
                    </span>
                    {item && (
                      <button
                        onClick={() => onUpdate(view, 'visible', !item.visible)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition ${
                          item.visible
                            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        }`}
                      >
                        {item.visible ? 'Visible' : 'Hidden'}
                      </button>
                    )}
                  </div>

                  {!item ? (
                    <label className="flex items-center justify-center gap-2 border border-dashed border-neutral-700/80 hover:border-blue-500/50 rounded-lg p-2.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-900/40 hover:bg-neutral-800/50 cursor-pointer transition group">
                      <svg className="w-3.5 h-3.5 text-neutral-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Upload {view} image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onUpload(view, file);
                        }}
                      />
                    </label>
                  ) : (
                    <div className="space-y-2.5 text-xs pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-neutral-400">Opacity</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={item.opacity}
                          onChange={(e) => onUpdate(view, 'opacity', parseFloat(e.target.value))}
                          className="w-28 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-neutral-400">Scale</span>
                        <input
                          type="range"
                          min="0.3"
                          max="2.5"
                          step="0.05"
                          value={item.scale}
                          onChange={(e) => onUpdate(view, 'scale', parseFloat(e.target.value))}
                          className="w-28 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};