import { useState, useEffect } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { toast } from "sonner";
import {
  fetchStatsPrivacy,
  checkUserNameAvailability,
  saveProfile,
} from "@/services/swr/editProfile";

/**
 * プロフィール編集フォームの状態管理・バリデーション・保存処理を行うフック。
 * ユーザー名の重複チェックはデバウンスして非同期実行する。
 *
 * @param onClose - 保存成功時に呼び出されるコールバック（省略可）
 * @returns フォームデータ・更新関数・名前チェック状態・送信処理・バリデーション結果
 */
export const useEditProfile = (onClose?: () => void) => {
  const { user, fbUser, refresh } = useUser();
  const fbUid = fbUser?.uid ?? null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    userName: "",
    iidxId: "",
    bio: "",
    isPublic: true,
    xId: "",
    profileImage: "",
  });

  const [arenaPrivacy, setArenaPrivacy] = useState({
    showArenaClass: true,
    showArenaRank: false,
    showArea: false,
    showGrade: false,
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
        bio: user.profileText || "",
        isPublic: !!user.isPublic,
        xId: user.xId || "",
        profileImage: user.profileImage || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (!fbUid || !fbUser) return;
    (async () => {
      try {
        const data = await fetchStatsPrivacy(fbUid, fbUser);
        if (data?.statsPrivacy) setArenaPrivacy(data.statsPrivacy);
      } catch { /* ignore */ }
    })();
  }, [fbUid, fbUser]);

  useEffect(() => {
    if (!fbUser || user) return;
    setFormData((prev) => ({
      ...prev,
      // fbUser.displayNameは連携プロバイダ側の表示名（本名等の機密情報を含む
      // ことがある）のため初期値に使わない。ユーザーに明示的に入力させる
      profileImage:
        prev.profileImage ||
        fbUser.photoURL?.replace("_normal", "") ||
        `https://api.dicebear.com/9.x/identicon/svg?seed=${fbUser.uid}`,
    }));
  }, [fbUser, user]);

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
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await checkUserNameAvailability(
          formData.userName,
          fbUser,
          controller.signal,
        );
        setNameStatus({
          isChecking: false,
          error: data.available ? null : (data.message ?? null),
          available: data.available,
        });
      } catch (e) {
        // 古い入力向けのリクエストがキャンセルされた場合、新しい入力の判定結果を上書きしない
        if (e instanceof DOMException && e.name === "AbortError") return;
        setNameStatus({
          isChecking: false,
          error: "接続エラー",
          available: false,
        });
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.userName, user, fbUser]);

  const handleSubmit = async () => {
    if (!fbUid || !fbUser) return;
    setIsSubmitting(true);
    try {
      const method = user ? "PATCH" : "POST";
      await saveProfile(fbUid, fbUser, method, formData, arenaPrivacy);
      await refresh?.();
      toast.success("保存しました");
      onClose?.();
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    arenaPrivacy,
    setArenaPrivacy,
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
