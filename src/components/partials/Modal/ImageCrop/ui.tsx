"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

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
      toast.success("画像をアップロードしました");
    } catch (error) {
      console.error(error);
      toast.error("アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md border-white/10 bg-slate-900 p-4">
        <DialogHeader>
          <DialogTitle className="text-white">画像を選択</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center gap-4 py-4">
          {!imgSrc ? (
            <div
              onClick={() => document.getElementById("file-input")?.click()}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-12 transition-colors hover:bg-white/10"
            >
              <Upload className="h-8 w-8 text-slate-500" />
              <p className="text-sm text-slate-400 font-medium">
                クリックして画像を選択
              </p>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative max-h-[400px] w-full overflow-hidden rounded-lg bg-black/50 border border-white/10">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                aspect={1}
                circularCrop
                className="mx-auto"
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  className="max-h-[400px] object-contain"
                />
              </ReactCrop>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-2">
          {imgSrc && !isUploading && (
            <Button
              variant="secondary"
              onClick={clearSelection}
              className="h-9"
            >
              再選択
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isUploading}
            className="h-9 text-slate-400"
          >
            キャンセル
          </Button>
          {imgSrc && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="h-9 min-w-[80px] bg-blue-600 hover:bg-blue-500"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "保存"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
