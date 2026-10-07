'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Box,
  CheckCircle2,
  Download,
  Focus,
  ImagePlus,
  Loader2,
  Maximize2,
  RefreshCw,
  Rotate3D,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

import { EngineContext } from '@/engine/3d/core/EngineContext';

import { ReferencePanel } from '../ReferenceOverlay/ReferencePanel';

import {
  ReferenceState,
  ReferenceView,
} from '@/types/reference';

export interface StudioViewportProps {
  engineRefProp?: React.MutableRefObject<EngineContext | null>;
  uiTheme?: 'dark' | 'light' | 'custom';
}

type TransformMode =
  | 'translate'
  | 'rotate'
  | 'scale';

type GenerationState =
  | 'idle'
  | 'uploading'
  | 'generating'
  | 'loading'
  | 'success'
  | 'error';

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const StudioViewport: React.FC<
  StudioViewportProps
> = ({
  engineRefProp,
  uiTheme = 'dark',
}) => {
  /*
   * ============================================================
   * ENGINE
   * ============================================================
   */

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const internalEngineRef =
    useRef<EngineContext | null>(null);

  const engineRef =
    engineRefProp || internalEngineRef;

  /*
   * ============================================================
   * GENERATION INPUT
   * ============================================================
   */

  const imageInputRef =
    useRef<HTMLInputElement | null>(null);

  const generationAbortRef =
    useRef<AbortController | null>(null);

  const [sourceImage, setSourceImage] =
    useState<File | null>(null);

  const [sourcePreviewUrl, setSourcePreviewUrl] =
    useState<string | null>(null);

  const [generationState, setGenerationState] =
    useState<GenerationState>('idle');

  const [generationMessage, setGenerationMessage] =
    useState<string>('');

  const [generationError, setGenerationError] =
    useState<string | null>(null);

  const [generatedModelName, setGeneratedModelName] =
    useState<string | null>(null);

  const [isDragOver, setIsDragOver] =
    useState(false);

  /*
   * ============================================================
   * VIEWPORT STATE
   * ============================================================
   */

  const [transformMode, setTransformMode] =
    useState<TransformMode>('translate');

  const [isAutoRotating, setIsAutoRotating] =
    useState(false);

  const [engineReady, setEngineReady] =
    useState(false);

  const [engineError, setEngineError] =
    useState<string | null>(null);

  /*
   * ============================================================
   * REFERENCES
   * ============================================================
   */

  const [references, setReferences] =
    useState<ReferenceState>({
      front: null,
      side: null,
      top: null,
    });

  /*
   * ============================================================
   * THEME
   * ============================================================
   */

  const isLight =
    uiTheme === 'light';

  /*
   * ============================================================
   * ENGINE INITIALIZATION
   * ============================================================
   */

  useEffect(() => {
    let animationFrame = 0;

    let observer:
      | ResizeObserver
      | null = null;

    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    animationFrame =
      window.requestAnimationFrame(() => {
        try {
          /*
           * Prevent duplicate engine creation.
           */

          if (engineRef.current) {
            setEngineReady(true);
            return;
          }

          const engine =
            new EngineContext({
              canvas,
              antialias: true,
            });

          engineRef.current =
            engine;

          engine.start();

          /*
           * Initial viewport size.
           */

          const parent =
            canvas.parentElement;

          if (parent) {
            const width =
              Math.max(
                parent.clientWidth,
                1
              );

            const height =
              Math.max(
                parent.clientHeight,
                1
              );

            engine.resize(
              width,
              height
            );
          }

          setEngineError(null);
          setEngineReady(true);
        } catch (error) {
          console.error(
            '[EYECAP 3D] Engine initialization failed:',
            error
          );

          setEngineError(
            '3D Engine initialization failed.'
          );

          setEngineReady(false);
        }
      });

    /*
     * ==========================================================
     * RESPONSIVE RESIZE
     * ==========================================================
     */

    const parentElement =
      canvas.parentElement;

    if (
      parentElement &&
      typeof ResizeObserver !==
        'undefined'
    ) {
      observer =
        new ResizeObserver(
          (entries) => {
            const engine =
              engineRef.current;

            if (!engine) {
              return;
            }

            for (const entry of entries) {
              let width =
                parentElement.clientWidth;

              let height =
                parentElement.clientHeight;

              const contentBoxSize =
                entry.contentBoxSize;

              if (contentBoxSize) {
                const box =
                  Array.isArray(
                    contentBoxSize
                  )
                    ? contentBoxSize[0]
                    : contentBoxSize;

                if (box) {
                  width =
                    box.inlineSize;

                  height =
                    box.blockSize;
                }
              }

              width =
                Math.max(
                  Math.floor(width),
                  1
                );

              height =
                Math.max(
                  Math.floor(height),
                  1
                );

              engine.resize(
                width,
                height
              );
            }
          }
        );

      observer.observe(
        parentElement
      );
    }

    /*
     * ==========================================================
     * CLEANUP
     * ==========================================================
     */

    return () => {
      window.cancelAnimationFrame(
        animationFrame
      );

      observer?.disconnect();

      const engine =
        engineRef.current;

      if (engine) {
        try {
          engine.dispose();
        } catch (error) {
          console.error(
            '[EYECAP 3D] Engine dispose failed:',
            error
          );
        }
      }

      engineRef.current = null;

      setEngineReady(false);
    };
  }, [engineRef]);

  /*
   * ============================================================
   * SOURCE IMAGE URL CLEANUP
   * ============================================================
   */

  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) {
        URL.revokeObjectURL(
          sourcePreviewUrl
        );
      }
    };
  }, [sourcePreviewUrl]);

  /*
   * ============================================================
   * REFERENCE IMAGE URL CLEANUP
   * ============================================================
   */

  useEffect(() => {
    return () => {
      Object.values(
        references
      ).forEach((reference) => {
        if (reference?.url) {
          URL.revokeObjectURL(
            reference.url
          );
        }
      });
    };
  }, []);

  /*
   * ============================================================
   * SELECT SOURCE IMAGE
   * ============================================================
   */

  const selectSourceImage =
    useCallback(
      (file: File) => {
        setGenerationError(null);
        setGenerationMessage('');

        /*
         * Validate MIME type.
         */

        if (
          !ACCEPTED_IMAGE_TYPES.includes(
            file.type
          )
        ) {
          setGenerationError(
            'Unsupported image format. Please use JPG, PNG or WebP.'
          );

          return;
        }

        /*
         * Validate file size.
         */

        if (
          file.size >
          MAX_IMAGE_SIZE
        ) {
          setGenerationError(
            'Image is too large. Maximum supported size is 20 MB.'
          );

          return;
        }

        /*
         * Revoke previous preview.
         */

        if (sourcePreviewUrl) {
          URL.revokeObjectURL(
            sourcePreviewUrl
          );
        }

        const preview =
          URL.createObjectURL(
            file
          );

        setSourceImage(file);
        setSourcePreviewUrl(
          preview
        );

        setGenerationState(
          'idle'
        );

        setGenerationMessage(
          'Image ready for 3D generation.'
        );
      },
      [sourcePreviewUrl]
    );

  /*
   * ============================================================
   * FILE INPUT
   * ============================================================
   */

  const handleFileInput =
    useCallback(
      (
        event:
          React.ChangeEvent<HTMLInputElement>
      ) => {
        const file =
          event.target.files?.[0];

        if (!file) {
          return;
        }

        selectSourceImage(
          file
        );

        /*
         * Allow selecting the same
         * file again later.
         */

        event.target.value = '';
      },
      [selectSourceImage]
    );

  /*
   * ============================================================
   * DRAG & DROP
   * ============================================================
   */

  const handleDragOver =
    useCallback(
      (
        event:
          React.DragEvent<HTMLDivElement>
      ) => {
        event.preventDefault();

        event.dataTransfer.dropEffect =
          'copy';

        setIsDragOver(true);
      },
      []
    );

  const handleDragLeave =
    useCallback(
      (
        event:
          React.DragEvent<HTMLDivElement>
      ) => {
        event.preventDefault();

        setIsDragOver(false);
      },
      []
    );

  const handleDrop =
    useCallback(
      (
        event:
          React.DragEvent<HTMLDivElement>
      ) => {
        event.preventDefault();

        setIsDragOver(false);

        const file =
          event.dataTransfer.files?.[0];

        if (!file) {
          return;
        }

        selectSourceImage(
          file
        );
      },
      [selectSourceImage]
    );

  /*
   * ============================================================
   * CLEAR SOURCE IMAGE
   * ============================================================
   */

  const clearSourceImage =
    useCallback(() => {
      if (sourcePreviewUrl) {
        URL.revokeObjectURL(
          sourcePreviewUrl
        );
      }

      generationAbortRef.current?.abort();

      generationAbortRef.current =
        null;

      setSourceImage(null);
      setSourcePreviewUrl(null);

      setGenerationState(
        'idle'
      );

      setGenerationMessage('');
      setGenerationError(null);
    }, [sourcePreviewUrl]);

  /*
   * ============================================================
   * GENERATE 3D
   * ============================================================
   */

  const generate3D =
    useCallback(async () => {
      if (!sourceImage) {
        setGenerationError(
          'Please upload a product image first.'
        );

        return;
      }

      const engine =
        engineRef.current;

      if (!engine) {
        setGenerationError(
          '3D engine is not ready yet.'
        );

        return;
      }

      /*
       * Abort previous request.
       */

      generationAbortRef.current?.abort();

      const controller =
        new AbortController();

      generationAbortRef.current =
        controller;

      setGenerationError(null);
      setGeneratedModelName(null);

      setGenerationState(
        'uploading'
      );

      setGenerationMessage(
        'Preparing product image...'
      );

      try {
        /*
         * ------------------------------------------------------
         * FORM DATA
         * ------------------------------------------------------
         */

        const formData =
          new FormData();

        formData.append(
          'image',
          sourceImage,
          sourceImage.name
        );

        setGenerationState(
          'generating'
        );

        setGenerationMessage(
          'AI is reconstructing the 3D model...'
        );

        /*
         * ------------------------------------------------------
         * CALL PYTHON GENERATION API
         * ------------------------------------------------------
         */

        const response =
          await fetch(
            '/api/3d/generate',
            {
              method: 'POST',
              body: formData,
              signal:
                controller.signal,
            }
          );

        /*
         * ------------------------------------------------------
         * HANDLE API ERROR
         * ------------------------------------------------------
         */

        if (!response.ok) {
          let errorMessage =
            '3D generation failed.';

          try {
            const contentType =
              response.headers.get(
                'content-type'
              );

            if (
              contentType?.includes(
                'application/json'
              )
            ) {
              const data =
                await response.json();

              if (
                typeof data?.error ===
                'string'
              ) {
                errorMessage =
                  data.error;
              }
            } else {
              const text =
                await response.text();

              if (text.trim()) {
                errorMessage =
                  text.trim();
              }
            }
          } catch {
            /*
             * Keep generic error.
             */
          }

          throw new Error(
            errorMessage
          );
        }

        /*
         * ------------------------------------------------------
         * RECEIVE GLB
         * ------------------------------------------------------
         */

        const glbBlob =
          await response.blob();

        if (
          glbBlob.size <= 0
        ) {
          throw new Error(
            'The generator returned an empty 3D file.'
          );
        }

        /*
         * ------------------------------------------------------
         * LOAD GLB INTO THREE.JS ENGINE
         * ------------------------------------------------------
         */

        setGenerationState(
          'loading'
        );

        setGenerationMessage(
          'Loading generated 3D model into Studio...'
        );

        const model =
          await engine.importGLB(
            glbBlob,
            {
              center: true,
              fitCamera: true,
              name:
                'Generated_Product_Model',
            }
          );

        /*
         * Make sure the generated
         * model is actually available.
         */

        if (!model) {
          throw new Error(
            '3D model could not be loaded into the Studio.'
          );
        }

        setGeneratedModelName(
          'Generated Product Model'
        );

        setGenerationState(
          'success'
        );

        setGenerationMessage(
          '3D model generated and loaded successfully.'
        );
      } catch (error) {
        /*
         * Abort is not a real generation error.
         */

        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return;
        }

        console.error(
          '[EYECAP 3D] Generation failed:',
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : 'Unknown 3D generation error.';

        setGenerationState(
          'error'
        );

        setGenerationError(
          message
        );

        setGenerationMessage('');
      } finally {
        generationAbortRef.current =
          null;
      }
    }, [engineRef, sourceImage]);

  /*
   * ============================================================
   * CANCEL GENERATION
   * ============================================================
   */

  const cancelGeneration =
    useCallback(() => {
      generationAbortRef.current?.abort();

      generationAbortRef.current =
        null;

      setGenerationState(
        'idle'
      );

      setGenerationMessage(
        'Generation cancelled.'
      );
    }, []);

  /*
   * ============================================================
   * TRANSFORM MODE
   * ============================================================
   */

  const handleModeChange =
    useCallback(
      (
        mode: TransformMode
      ) => {
        setTransformMode(mode);

        const engine =
          engineRef.current;

        if (!engine) {
          return;
        }

        engine.setTransformMode(
          mode
        );
      },
      [engineRef]
    );

  /*
   * ============================================================
   * AUTO ROTATION
   * ============================================================
   */

  const toggleAutoRotate =
    useCallback(() => {
      setIsAutoRotating(
        (previous) => {
          const nextState =
            !previous;

          const engine =
            engineRef.current;

          if (engine) {
            engine.setAutoRotate(
              nextState
            );
          }

          return nextState;
        }
      );
    }, [engineRef]);

  /*
   * ============================================================
   * FOCUS
   * ============================================================
   */

  const handleFocus =
    useCallback(() => {
      const engine =
        engineRef.current;

      if (!engine) {
        return;
      }

      engine.focusSelectedObject();
    }, [engineRef]);

  /*
   * ============================================================
   * REMOVE GENERATED MODEL
   * ============================================================
   */

  const removeGeneratedModel =
    useCallback(() => {
      const engine =
        engineRef.current;

      if (!engine) {
        return;
      }

      engine.removeImportedModel();

      setGeneratedModelName(
        null
      );

      setGenerationState(
        'idle'
      );

      setGenerationMessage(
        'Generated model removed from Studio.'
      );
    }, [engineRef]);

  /*
   * ============================================================
   * EXPORT GENERATED MODEL
   * ============================================================
   */

  const exportGeneratedModel =
    useCallback(async () => {
      const engine =
        engineRef.current;

      if (!engine) {
        return;
      }

      try {
        await engine.exportModel(
          'eyecap-product.glb'
        );
      } catch (error) {
        console.error(
          '[EYECAP 3D] Model export failed:',
          error
        );

        setGenerationError(
          'Unable to export the 3D model.'
        );
      }
    }, [engineRef]);

  /*
   * ============================================================
   * REFERENCE UPLOAD
   * ============================================================
   */

  const handleReferenceUpload =
    useCallback(
      (
        view: ReferenceView,
        file: File
      ) => {
        if (
          !file.type.startsWith(
            'image/'
          )
        ) {
          console.warn(
            '[EYECAP 3D] Unsupported reference file:',
            file.type
          );

          return;
        }

        const url =
          URL.createObjectURL(
            file
          );

        setReferences(
          (previous) => {
            const previousReference =
              previous[view];

            if (
              previousReference?.url
            ) {
              URL.revokeObjectURL(
                previousReference.url
              );
            }

            return {
              ...previous,

              [view]: {
                id: `${Date.now()}-${view}`,

                view,

                url,

                opacity: 0.5,

                scale: 1,

                offsetX: 0,

                offsetY: 0,

                visible: true,
              },
            };
          }
        );
      },
      []
    );

  /*
   * ============================================================
   * REFERENCE UPDATE
   * ============================================================
   */

  const handleReferenceUpdate =
    useCallback(
      (
        view: ReferenceView,
        key: string,
        value:
          | number
          | boolean
      ) => {
        setReferences(
          (previous) => {
            const current =
              previous[view];

            if (!current) {
              return previous;
            }

            return {
              ...previous,

              [view]: {
                ...current,

                [key]: value,
              },
            };
          }
        );
      },
      []
    );

  /*
   * ============================================================
   * REMOVE REFERENCE
   * ============================================================
   */

  const removeReference =
    useCallback(
      (view: ReferenceView) => {
        setReferences(
          (previous) => {
            const current =
              previous[view];

            if (current?.url) {
              URL.revokeObjectURL(
                current.url
              );
            }

            return {
              ...previous,
              [view]: null,
            };
          }
        );
      },
      []
    );

  /*
   * Keep function available for
   * future ReferencePanel controls.
   */

  void removeReference;

  /*
   * ============================================================
   * ACTIVE REFERENCE
   * ============================================================
   */

  const activeReference =
    references.front?.visible
      ? references.front
      : null;

  /*
   * ============================================================
   * GENERATION STATUS
   * ============================================================
   */

  const isGenerating =
    generationState ===
      'uploading' ||
    generationState ===
      'generating' ||
    generationState ===
      'loading';

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div
      className={[
        'relative',
        'w-full',
        'h-full',
        'min-h-[500px]',
        'overflow-hidden',
        'select-none',
        'transition-colors',
        'duration-200',

        isLight
          ? 'bg-slate-100 text-slate-900'
          : 'bg-neutral-950 text-neutral-100',
      ].join(' ')}
      onDragOver={
        handleDragOver
      }
      onDragLeave={
        handleDragLeave
      }
      onDrop={handleDrop}
    >
      {/* ======================================================
          THREE.JS CANVAS
      ======================================================= */}

      <canvas
        ref={canvasRef}
        className="
          absolute
          inset-0
          w-full
          h-full
          block
          cursor-grab
          active:cursor-grabbing
          touch-none
          outline-none
          z-0
        "
        tabIndex={0}
        aria-label="EYECAP 3D Studio Viewport"
      />

      {/* ======================================================
          DRAG OVERLAY
      ======================================================= */}

      {isDragOver && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-purple-950/40 backdrop-blur-sm">
          <div className="rounded-3xl border-2 border-dashed border-purple-400 bg-neutral-950/90 px-10 py-8 text-center shadow-2xl">
            <Upload className="mx-auto h-10 w-10 text-purple-400" />

            <div className="mt-3 text-lg font-bold text-white">
              Drop Product Image
            </div>

            <div className="mt-1 text-xs text-neutral-400">
              JPG, PNG or WebP
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          ENGINE ERROR
      ======================================================= */}

      {engineError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="max-w-sm mx-4 rounded-2xl border border-red-900/50 bg-neutral-950/95 backdrop-blur-xl px-5 py-4 text-center shadow-2xl">
            <div className="text-sm font-semibold text-red-400">
              3D Engine Error
            </div>

            <div className="mt-1 text-xs text-neutral-500">
              {engineError}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          ENGINE INITIALIZING
      ======================================================= */}

      {!engineReady &&
        !engineError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-neutral-950/80 backdrop-blur-xl border border-neutral-800 px-6 py-5 shadow-2xl">
              <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />

              <span className="text-[10px] text-neutral-500 font-mono tracking-widest">
                INITIALIZING EYECAP ENGINE
              </span>
            </div>
          </div>
        )}

      {/* ======================================================
          AI 3D GENERATOR PANEL
      ======================================================= */}

      <div className="absolute top-3 right-3 z-30 w-[min(360px,calc(100%-1.5rem))]">
        <div
          className={[
            'rounded-2xl',
            'border',
            'backdrop-blur-xl',
            'shadow-2xl',
            'overflow-hidden',

            isLight
              ? 'bg-white/95 border-slate-300'
              : 'bg-neutral-950/90 border-neutral-800',
          ].join(' ')}
        >
          {/* Header */}

          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>

              <div>
                <div className="text-xs font-bold tracking-wider">
                  AI 3D GENERATOR
                </div>

                <div className="text-[9px] text-neutral-500 font-mono">
                  IMAGE → REALISTIC 3D
                </div>
              </div>
            </div>

            {sourceImage && (
              <button
                type="button"
                onClick={
                  clearSourceImage
                }
                className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition"
                title="Clear image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Upload Area */}

          {!sourceImage ? (
            <button
              type="button"
              onClick={() =>
                imageInputRef.current?.click()
              }
              className={[
                'm-3',
                'w-[calc(100%-1.5rem)]',
                'rounded-xl',
                'border-2',
                'border-dashed',
                'px-5',
                'py-8',
                'transition-all',
                'text-center',

                isLight
                  ? 'border-slate-300 hover:border-purple-400 hover:bg-purple-50'
                  : 'border-neutral-700 hover:border-purple-500 hover:bg-purple-950/20',
              ].join(' ')}
            >
              <ImagePlus className="mx-auto w-8 h-8 text-purple-400" />

              <div className="mt-3 text-xs font-bold">
                Upload Product Image
              </div>

              <div className="mt-1 text-[10px] text-neutral-500">
                Click or drag & drop
              </div>

              <div className="mt-2 text-[9px] text-neutral-600 font-mono">
                JPG • PNG • WEBP • MAX 20MB
              </div>
            </button>
          ) : (
            <div className="p-3">
              {/* Image Preview */}

              <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-black/40">
                <img
                  src={
                    sourcePreviewUrl ||
                    ''
                  }
                  alt="3D generation source"
                  className="w-full h-44 object-contain"
                  draggable={false}
                />

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                  <div className="max-w-[75%] truncate rounded-lg bg-black/75 px-2 py-1 text-[9px] text-neutral-300 backdrop-blur">
                    {sourceImage.name}
                  </div>

                  <div className="rounded-lg bg-black/75 px-2 py-1 text-[9px] text-neutral-400 backdrop-blur">
                    {(
                      sourceImage.size /
                      1024 /
                      1024
                    ).toFixed(2)}
                    MB
                  </div>
                </div>
              </div>

              {/* Generate Button */}

              <button
                type="button"
                disabled={
                  !engineReady ||
                  isGenerating
                }
                onClick={
                  generate3D
                }
                className="
                  mt-3
                  w-full
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-gradient-to-r
                  from-purple-600
                  to-indigo-600
                  px-4
                  py-3
                  text-xs
                  font-bold
                  text-white
                  shadow-lg
                  shadow-purple-900/30
                  transition
                  hover:from-purple-500
                  hover:to-indigo-500
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />

                    {generationState ===
                    'loading'
                      ? 'LOADING MODEL...'
                      : 'GENERATING 3D...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />

                    GENERATE 3D MODEL
                  </>
                )}
              </button>
            </div>
          )}

          {/* Hidden File Input */}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={
              handleFileInput
            }
            className="hidden"
          />

          {/* ==================================================
              GENERATION STATUS
          ================================================== */}

          {(generationMessage ||
            generationError) && (
            <div className="px-3 pb-3">
              <div
                className={[
                  'rounded-xl',
                  'border',
                  'px-3',
                  'py-2.5',

                  generationError
                    ? 'border-red-900/50 bg-red-950/30'
                    : generationState ===
                        'success'
                      ? 'border-emerald-900/50 bg-emerald-950/30'
                      : 'border-neutral-800 bg-neutral-900/70',
                ].join(' ')}
              >
                <div className="flex items-start gap-2">
                  {isGenerating ? (
                    <Loader2 className="mt-0.5 w-3.5 h-3.5 shrink-0 text-purple-400 animate-spin" />
                  ) : generationError ? (
                    <X className="mt-0.5 w-3.5 h-3.5 shrink-0 text-red-400" />
                  ) : generationState ===
                    'success' ? (
                    <CheckCircle2 className="mt-0.5 w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  ) : null}

                  <div className="min-w-0">
                    <div
                      className={[
                        'text-[10px] font-semibold',

                        generationError
                          ? 'text-red-400'
                          : generationState ===
                              'success'
                            ? 'text-emerald-400'
                            : 'text-neutral-300',
                      ].join(' ')}
                    >
                      {generationError ||
                        generationMessage}
                    </div>

                    {isGenerating && (
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-800">
                        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-[pulse_1.2s_ease-in-out_infinite]" />
                      </div>
                    )}
                  </div>
                </div>

                {isGenerating && (
                  <button
                    type="button"
                    onClick={
                      cancelGeneration
                    }
                    className="mt-2 text-[9px] text-neutral-500 hover:text-white"
                  >
                    Cancel generation
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              GENERATED MODEL ACTIONS
          ================================================== */}

          {generatedModelName && (
            <div className="px-3 pb-3">
              <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />

                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-emerald-400">
                      MODEL READY
                    </div>

                    <div className="truncate text-[9px] text-neutral-500">
                      {generatedModelName}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={
                      handleFocus
                    }
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-2 py-2 text-[9px] font-bold text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                  >
                    <Focus className="w-3.5 h-3.5" />

                    Focus
                  </button>

                  <button
                    type="button"
                    onClick={
                      exportGeneratedModel
                    }
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-2 py-2 text-[9px] font-bold text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                  >
                    <Download className="w-3.5 h-3.5" />

                    Export GLB
                  </button>
                </div>

                <button
                  type="button"
                  onClick={
                    removeGeneratedModel
                  }
                  className="mt-2 w-full rounded-lg border border-neutral-800 px-2 py-2 text-[9px] font-bold text-neutral-500 hover:border-red-900/50 hover:bg-red-950/20 hover:text-red-400 transition"
                >
                  Remove Generated Model
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          TRANSFORM TOOLBAR
      ======================================================= */}

      <div
        className={[
          'absolute',
          'top-3',
          'left-1/2',
          '-translate-x-1/2',
          'z-20',
          'flex',
          'items-center',
          'gap-1.5',
          'backdrop-blur-md',
          'p-1.5',
          'rounded-xl',
          'border',
          'shadow-xl',
          'max-w-[90vw]',
          'overflow-x-auto',

          isLight
            ? 'bg-white/90 border-slate-300'
            : 'bg-neutral-900/90 border-neutral-800',
        ].join(' ')}
        role="toolbar"
        aria-label="3D Transform and Viewport Controls"
      >
        {(
          [
            'translate',
            'rotate',
            'scale',
          ] as const
        ).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() =>
              handleModeChange(
                mode
              )
            }
            className={[
              'px-3',
              'py-1.5',
              'rounded-lg',
              'text-xs',
              'font-bold',
              'capitalize',
              'transition-all',
              'focus:outline-none',
              'focus:ring-2',
              'focus:ring-blue-500',
              'shrink-0',

              transformMode === mode
                ? 'bg-blue-600 text-white shadow-md'
                : isLight
                  ? 'text-slate-700 hover:bg-slate-200'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800',
            ].join(' ')}
          >
            {mode}
          </button>
        ))}

        <div
          className={[
            'w-px',
            'h-5',
            'mx-1',
            'shrink-0',

            isLight
              ? 'bg-slate-300'
              : 'bg-neutral-700',
          ].join(' ')}
        />

        {/* Focus */}

        <button
          type="button"
          onClick={
            handleFocus
          }
          title="Focus Selected Mesh"
          aria-label="Focus Selected Mesh"
          className={[
            'px-2.5',
            'py-1.5',
            'rounded-lg',
            'text-xs',
            'font-bold',
            'transition',
            'focus:outline-none',
            'focus:ring-2',
            'focus:ring-blue-500',
            'shrink-0',

            isLight
              ? 'text-slate-700 hover:bg-slate-200'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800',
          ].join(' ')}
        >
          🎯 Focus
        </button>

        {/* Auto Rotate */}

        <button
          type="button"
          onClick={
            toggleAutoRotate
          }
          title="360 Turntable Mode"
          aria-label="Toggle 360 Turntable Mode"
          aria-pressed={
            isAutoRotating
          }
          className={[
            'px-2.5',
            'py-1.5',
            'rounded-lg',
            'text-xs',
            'font-bold',
            'transition',
            'flex',
            'items-center',
            'gap-1',
            'focus:outline-none',
            'focus:ring-2',
            'focus:ring-emerald-500',
            'shrink-0',

            isAutoRotating
              ? 'bg-emerald-600 text-white shadow-md'
              : isLight
                ? 'text-slate-700 hover:bg-slate-200'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800',
          ].join(' ')}
        >
          🔄 360°
        </button>
      </div>

      {/* ======================================================
          FRONT REFERENCE OVERLAY
      ======================================================= */}

      {activeReference && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <img
            src={
              activeReference.url
            }
            alt="Front eyewear reference"
            draggable={false}
            style={{
              opacity:
                activeReference.opacity,

              transform: `
                translate(
                  ${activeReference.offsetX}px,
                  ${activeReference.offsetY}px
                )
                scale(${activeReference.scale})
              `,
            }}
            className="
              max-h-[75%]
              max-w-[75%]
              object-contain
              transition-transform
              duration-75
              ease-out
            "
          />
        </div>
      )}

      {/* ======================================================
          VIEWPORT STATUS
      ======================================================= */}

      <div
        className={[
          'absolute',
          'top-3',
          'left-3',
          'z-20',
          'hidden',
          'md:flex',
          'items-center',
          'gap-2',
          'backdrop-blur-md',
          'text-xs',
          'px-3',
          'py-1.5',
          'rounded-xl',
          'border',
          'shadow-md',

          isLight
            ? 'bg-white/90 border-slate-300 text-slate-800 font-bold'
            : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 font-medium',
        ].join(' ')}
      >
        <span
          className={[
            'w-2',
            'h-2',
            'rounded-full',

            engineReady
              ? 'bg-emerald-500 animate-pulse'
              : 'bg-amber-500 animate-pulse',
          ].join(' ')}
        />

        <span>
          EYECAP Viewport
        </span>
      </div>

      {/* ======================================================
          REFERENCE PANEL
      ======================================================= */}

      <div
        className="
          absolute
          bottom-4
          right-4
          z-20
          max-h-[calc(100%-4rem)]
          overflow-y-auto
          pointer-events-auto
        "
      >
        <ReferencePanel
          references={
            references
          }
          onUpload={
            handleReferenceUpload
          }
          onUpdate={
            handleReferenceUpdate
          }
        />
      </div>

      {/* ======================================================
          BOTTOM ENGINE STATUS
      ======================================================= */}

      <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
        <div className="px-3 py-1.5 rounded-lg bg-neutral-950/70 backdrop-blur-md border border-neutral-800/80">
          <span className="text-[9px] text-neutral-500 font-mono tracking-wider">
            THREE.JS • EYECAP 3D ENGINE
          </span>
        </div>
      </div>

      {/* ======================================================
          GENERATION ACTIVE OVERLAY
      ======================================================= */}

      {isGenerating && (
        <div className="absolute inset-0 z-25 pointer-events-none">
          <div className="absolute inset-0 bg-black/10" />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-3 rounded-full border border-purple-500/30 bg-neutral-950/90 px-5 py-3 shadow-2xl backdrop-blur-xl">
              <div className="relative">
                <div className="w-5 h-5 rounded-full border-2 border-purple-500/30" />

                <div className="absolute inset-0 w-5 h-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
              </div>

              <div>
                <div className="text-[10px] font-bold text-white">
                  EYECAP AI 3D
                </div>

                <div className="text-[9px] text-neutral-500">
                  {generationMessage}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioViewport;