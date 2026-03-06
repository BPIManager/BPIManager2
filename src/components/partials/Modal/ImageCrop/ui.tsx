import React, { useState, useRef } from "react";
import { Box, VStack, Text, Image as ChakraImage } from "@chakra-ui/react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ReactCrop,
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { toaster } from "@/components/ui/toaster";

interface Props {
  uid: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (url: string) => void;
}

export const ImageUploadModal = ({
  uid,
  isOpen,
  onClose,
  onSuccess,
}: Props) => {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [isUploading, setIsUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const clearSelection = () => {
    setImgSrc("");
    setCrop(undefined);
  };

  const handleClose = () => {
    if (isUploading) return;
    clearSelection();
    onClose();
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || ""),
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
      width,
      height,
    );
    setCrop(initialCrop);
  };

  const handleUpload = async () => {
    if (!imgRef.current || !crop || !uid) return;

    setIsUploading(true);
    try {
      const canvas = document.createElement("canvas");
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(
          imgRef.current,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          256,
          256,
        );
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85),
      );
      if (!blob) throw new Error("Canvas error");

      const storageRef = ref(storage, `users/${uid}/profile.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      onSuccess(downloadURL);
      handleClose();
      toaster.create({ title: "画像をアップロードしました", type: "success" });
    } catch (error) {
      console.error(error);
      toaster.create({ title: "アップロードに失敗しました", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DialogRoot
      open={isOpen}
      placement={{ mdDown: "top", md: "center" }}
      onOpenChange={(e) => {
        if (!e.open && !isUploading && onClose) {
          onClose();
        }
      }}
      closeOnInteractOutside={!isUploading}
    >
      <DialogContent bg="bg.panel" borderRadius="xl" p={2}>
        <DialogHeader>
          <DialogTitle>画像を選択</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack gap={4}>
            {!imgSrc ? (
              <Box
                border="2px dashed"
                borderColor="border.muted"
                p={10}
                textAlign="center"
                borderRadius="md"
                w="full"
                cursor="pointer"
                _hover={{ bg: "whiteAlpha.50" }}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Text color="fg.muted">クリックして画像を選択</Text>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={onSelectFile}
                  style={{ display: "none" }}
                />
              </Box>
            ) : (
              <Box maxH="400px" overflow="hidden" borderRadius="md">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <ChakraImage
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    onLoad={onImageLoad}
                    maxH="400px"
                  />
                </ReactCrop>
              </Box>
            )}
          </VStack>
        </DialogBody>
        <DialogFooter gap={3}>
          {imgSrc && !isUploading && (
            <Button
              variant="subtle"
              colorPalette="gray"
              onClick={clearSelection}
            >
              再選択
            </Button>
          )}

          <Button variant="ghost" onClick={handleClose} disabled={isUploading}>
            キャンセル
          </Button>

          {imgSrc && (
            <Button
              colorPalette="blue"
              onClick={handleUpload}
              loading={isUploading}
            >
              保存
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
