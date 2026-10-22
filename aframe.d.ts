import type { DetailedHTMLProps, HTMLAttributes } from "react";

type AFrameElement = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
>;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "a-scene": AFrameElement & {
        embedded?: boolean;
        "mindar-image"?: string;
        "color-space"?: string;
        renderer?: string;
        "vr-mode-ui"?: string;
        "device-orientation-permission-ui"?: string;
      };

      "a-assets": AFrameElement;

      "a-asset-item": AFrameElement & {
        src?: string;
      };

      "a-camera": AFrameElement & {
        position?: string;
        "look-controls"?: string;
      };

      "a-entity": AFrameElement & {
        position?: string;
        rotation?: string;
        scale?: string;
        "mindar-image-target"?: string;
        "gltf-model"?: string;
      };

      "a-plane": AFrameElement & {
        position?: string;
        rotation?: string;
        width?: string;
        height?: string;
        color?: string;
        opacity?: string;
      };

      "a-gltf-model": AFrameElement & {
        src?: string;
        position?: string;
        rotation?: string;
        scale?: string;
      };
    }
  }
}

export {};