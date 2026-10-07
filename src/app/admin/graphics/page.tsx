'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { EngineContext } from '@/engine/3d/core/EngineContext';
import { Maximize2, Minimize2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const StudioViewport = dynamic(
  () => import('@/components/3d-studio/Viewport/StudioViewport').then((m) => m.StudioViewport),
  { ssr: false }
);

export default function AdminGraphicsStudioPage() {
  const engineRef = useRef<EngineContext | null>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(true); // ডিফল্টভাবে Admin UI হাইড থাকবে

  return (
    <div
      className={
        isFocusMode
          ? 'fixed inset-0 z-50 w-screen h-screen bg-neutral-950 overflow-hidden' // 👈 পুরো এডমিন UI ঢেকে একদম ফুলস্ক্রিন ৩ডি স্টুডিও
          : 'relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-neutral-950' // 👈 সাধারণ এডমিন লেআউটে থাকবে
      }
    >
      {/* 3D Studio Canvas */}
      <StudioViewport engineRefProp={engineRef} />

      {/* Floating Control Button: Admin UI Hide/Show & Back Button */}
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
        {/* Toggle Focus Mode Button */}
        <button
          onClick={() => setIsFocusMode(!isFocusMode)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900/90 text-neutral-200 border border-neutral-700/80 backdrop-blur-md hover:bg-neutral-800 transition shadow-lg"
          title={isFocusMode ? 'Show Admin Sidebar/Header' : 'Hide Admin Sidebar (Full Studio)'}
        >
          {isFocusMode ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Exit Focus Mode</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Full Studio View</span>
            </>
          )}
        </button>

        {/* Back to Dashboard Link */}
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900/90 text-neutral-300 border border-neutral-700/80 backdrop-blur-md hover:bg-neutral-800 transition shadow-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  );
}