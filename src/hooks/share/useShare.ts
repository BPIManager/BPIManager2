import { useState } from "react";
import { toBlob } from "html-to-image";
import { v4 as uuidv4 } from "uuid";
import { toaster } from "@/components/ui/chakra/toaster";

export const useShareResult = () => {
  const [isSharing, setIsSharing] = useState(false);

  const share = async (
    element: HTMLElement | null,
    text: string,
    captureWidth = 450,
  ): Promise<boolean> => {
    if (!element) return false;
    setIsSharing(true);

    try {
      const blob = await toBlob(element, {
        cacheBust: true,
        backgroundColor: "#0d1117",
        style: {
          width: `${captureWidth}px`,
          margin: "0",
        },
      });
      if (!blob) throw new Error("Failed to generate image");

      const file = new File([blob], `bpim2-result-${uuidv4()}.png`, {
        type: "image/png",
      });

      const shareData = {
        title: "BPIM2 Result",
        text: text,
        files: [file],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      } else {
        throw new Error("Sharing not supported");
      }
    } catch (error) {
      console.log(error);
      toaster.create({
        title: "Error",
        description: "Failed to generate a image",
        type: "error",
      });
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  return { share, isSharing };
};
