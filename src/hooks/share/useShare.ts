import { useState } from "react";
import { toBlob } from "html-to-image";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

const getCssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const useShareResult = () => {
  const [isSharing, setIsSharing] = useState(false);

  const share = async (
    element: HTMLElement | null,
    text: string,
    captureWidth = 640,
  ): Promise<boolean> => {
    if (!element) return false;
    setIsSharing(true);

    try {
      const rawHsl = getCssVar("--bpim-bg");
      const backgroundColor = rawHsl ? `hsl(${rawHsl})` : "#0d1117";

      const originalStyle = element.getAttribute("style") ?? "";

      element.style.width = `${captureWidth}px`;
      element.style.maxWidth = `${captureWidth}px`;
      element.style.minWidth = `${captureWidth}px`;

      const gridEls = element.querySelectorAll<HTMLElement>(
        "[class*='lg:grid-cols']",
      );
      const savedGridStyles: { el: HTMLElement; style: string }[] = [];
      gridEls.forEach((el) => {
        savedGridStyles.push({ el, style: el.getAttribute("style") ?? "" });
        el.style.gridTemplateColumns = "1fr";
      });

      const animEls = element.querySelectorAll<HTMLElement>(
        "[data-capture-no-anim]",
      );
      const savedAnimStyles: { el: HTMLElement; style: string }[] = [];
      animEls.forEach((el) => {
        savedAnimStyles.push({ el, style: el.getAttribute("style") ?? "" });
        el.style.animation = "none";
        el.style.transform = "scaleY(1)";
      });

      let blob: Blob | null = null;
      try {
        blob = await toBlob(element, {
          cacheBust: true,
          backgroundColor,
          pixelRatio: 2,
          style: { margin: "0" },
        });
      } finally {
        element.setAttribute("style", originalStyle);
        if (!originalStyle) element.removeAttribute("style");

        savedGridStyles.forEach(({ el, style }) => {
          if (style) el.setAttribute("style", style);
          else el.removeAttribute("style");
        });

        savedAnimStyles.forEach(({ el, style }) => {
          if (style) el.setAttribute("style", style);
          else el.removeAttribute("style");
        });
      }

      if (!blob) throw new Error("Failed to generate image");

      const file = new File([blob], `bpim2-result-${uuidv4()}.png`, {
        type: "image/png",
      });

      const shareData = { title: "BPIM2 Result", text, files: [file] };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      } else {
        throw new Error("Sharing not supported");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to generate a image");
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  return { share, isSharing };
};
