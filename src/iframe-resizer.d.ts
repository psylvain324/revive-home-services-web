declare module "iframe-resizer/js/iframeResizer" {
  type ResizeController = {
    removeListeners: () => void;
    resize: () => void;
  };

  type ResizedIframe = HTMLIFrameElement & {
    iFrameResizer?: ResizeController;
  };

  type ResizeOptions = {
    checkOrigin: boolean;
    heightCalculationMethod?: "bodyOffset" | "bodyScroll" | "documentElementOffset" | "documentElementScroll" | "lowestElement" | "max" | "min" | "taggedElement";
    scrolling?: boolean;
    warningTimeout?: number;
  };

  export default function iframeResizer(options: ResizeOptions, target: HTMLIFrameElement): ResizedIframe[];
}
