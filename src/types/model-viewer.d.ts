import type React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        alt?: string;
        poster?: string;

        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        ar?: boolean;

        "rotation-per-second"?: string;
        "camera-orbit"?: string;
        "field-of-view"?: string;
        "min-camera-orbit"?: string;
        "max-camera-orbit"?: string;

        exposure?: string;
        "shadow-intensity"?: string;
        "environment-image"?: string;

        loading?: "auto" | "eager" | "lazy";
      };
    }
  }
}

export {};