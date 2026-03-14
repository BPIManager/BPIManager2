import { useState, useEffect } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { toaster } from "@/components/ui/toaster";

export const useEditProfile = (onClose?: () => void) => {
  const { user, fbUser, refresh } = useUser();
  const [fbUid, setFbUid] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    userName: "",
    iidxId: "",
    arenaRank: "-",
    bio: "",
    isPublic: true,
    xId: "",
    profileImage: "",
  });

  const [nameStatus, setNameStatus] = useState({
    isChecking: false,
    error: null as string | null,
    available: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        userName: user.userName || "",
        iidxId: user.iidxId || "",
        arenaRank: user.arenaRank || "-",
        bio: user.profileText || "",
        isPublic: !!user.isPublic,
        xId: user.xId || "",
        profileImage: user.profileImage || "",
      });
    }
  }, [user]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        setFbUid(u.uid);
        if (!user) {
          setFormData((prev) => ({
            ...prev,
            userName: prev.userName || u.displayName || "",
            profileImage:
              prev.profileImage ||
              u.photoURL?.replace("_normal", "") ||
              `https://api.dicebear.com/9.x/identicon/svg?seed=${u.uid}`,
          }));
        }
      }
    });
  }, [user]);

  useEffect(() => {
    if (!formData.userName) {
      setNameStatus({
        isChecking: false,
        error: "ユーザー名は必須です",
        available: false,
      });
      return;
    }
    if (user && formData.userName === user.userName) {
      setNameStatus({ isChecking: false, error: null, available: true });
      return;
    }

    setNameStatus((prev) => ({ ...prev, isChecking: true, error: null }));
    const timer = setTimeout(async () => {
      try {
        const token = await fbUser?.getIdToken();
        const res = await fetch(
          `/api/usernames/${encodeURIComponent(formData.userName)}/availability`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        setNameStatus({
          isChecking: false,
          error: data.available ? null : data.message,
          available: data.available,
        });
      } catch {
        setNameStatus({
          isChecking: false,
          error: "接続エラー",
          available: false,
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.userName, user, fbUser]);

  const handleSubmit = async () => {
    if (!fbUid || !fbUser) return;
    setIsSubmitting(true);
    try {
      const token = await fbUser.getIdToken();
      const method = user ? "PATCH" : "POST";
      const res = await fetch(`/api/${fbUid}/profile`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          iidxId: formData.iidxId.replace(/-/g, ""),
          arenaRank: formData.arenaRank === "-" ? null : formData.arenaRank,
          profileText: formData.bio || null,
          isPublic: formData.isPublic ? 1 : 0,
        }),
      });

      if (!res.ok) throw new Error();
      await refresh?.();
      toaster.create({ title: "保存しました", type: "success" });
      onClose?.();
    } catch {
      toaster.create({ title: "保存に失敗しました", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    nameStatus,
    fbUid,
    isSubmitting,
    handleSubmit,
    isValid:
      formData.userName &&
      !nameStatus.error &&
      !nameStatus.isChecking &&
      /^\d{8}$/.test(formData.iidxId.replace(/-/g, "")),
  };
};
