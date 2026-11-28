import { useState, useEffect, useMemo, useRef } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { toast } from "sonner";
import {
  fetchStatsPrivacy,
  checkUserNameAvailability,
  saveProfile,
} from "@/services/swr/profile/editProfile";

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
    // オプション統計への参加。既定は「提供する」
    optionStats: true,
    xId: "",
    profileImage: "",
  });

  const [arenaPrivacy, setArenaPrivacy] = useState({
    showArenaClass: true,
    showArenaRank: false,
    showArea: false,
    showGrade: false,
  });

  // 重複チェックの結果。表示用の nameStatus は現在の入力名から導く（effect 内で同期的に state を更新しない）
  const [nameCheck, setNameCheck] = useState<{
    name: string;
    error: string | null;
    available: boolean;
  } | null>(null);

  // 入力中の内容を保つため、フォームの初期化はユーザーIDが変わったときに1回だけ行う。
  // SWRの再取得で user の参照が変わっても（同じユーザーなら）入力値は上書きしない
  const initializedUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || initializedUserIdRef.current === user.userId) return;
    initializedUserIdRef.current = user.userId;
    setFormData({
      userName: user.userName || "",
      iidxId: user.iidxId || "",
      bio: user.profileText || "",
      isPublic: !!user.isPublic,
      // 列を足す前の応答（値がない）では「提供する」
      optionStats: user.optionStats !== 0,
      xId: user.xId || "",
      profileImage: user.profileImage || "",
    });
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

  const userName = formData.userName;
  const needsNameCheck = !!userName && !(user && userName === user.userName);

  useEffect(() => {
    if (!needsNameCheck) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await checkUserNameAvailability(
          userName,
          fbUser,
          controller.signal,
        );
        setNameCheck({
          name: userName,
          error: data.available ? null : (data.message ?? null),
          available: data.available,
        });
      } catch (e) {
        // 古い入力向けのリクエストがキャンセルされた場合、新しい入力の判定結果を上書きしない
        if (e instanceof DOMException && e.name === "AbortError") return;
        setNameCheck({ name: userName, error: "接続エラー", available: false });
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [userName, needsNameCheck, fbUser]);

  const nameStatus = useMemo(() => {
    if (!userName) {
      return { isChecking: false, error: "ユーザー名は必須です", available: false };
    }
    if (!needsNameCheck) {
      return { isChecking: false, error: null as string | null, available: true };
    }
    if (nameCheck?.name === userName) {
      return {
        isChecking: false,
        error: nameCheck.error,
        available: nameCheck.available,
      };
    }
    return { isChecking: true, error: null, available: nameCheck?.available ?? true };
  }, [userName, needsNameCheck, nameCheck]);

  // 新規登録時は、連携プロバイダのアイコン（なければidenticon）を画像の初期値として使う。
  // fbUser.displayNameは本名等の機密情報を含むことがあるため初期値に使わない
  const defaultProfileImage =
    fbUser && !user
      ? fbUser.photoURL?.replace("_normal", "") ||
        `https://api.dicebear.com/9.x/identicon/svg?seed=${fbUser.uid}`
      : "";
  const effectiveFormData = {
    ...formData,
    profileImage: formData.profileImage || defaultProfileImage,
  };

  const handleSubmit = async () => {
    if (!fbUid || !fbUser) return;
    setIsSubmitting(true);
    try {
      const method = user ? "PATCH" : "POST";
      await saveProfile(fbUid, fbUser, method, effectiveFormData, arenaPrivacy);
      await refresh?.();
      toast.success("保存しました");
      onClose?.();
    } catch (e) {
      const reason = e instanceof Error && e.message ? `: ${e.message}` : "";
      toast.error(`保存に失敗しました${reason}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData: effectiveFormData,
    setFormData,
    arenaPrivacy,
    setArenaPrivacy,
    nameStatus,
    fbUid,
    isSubmitting,
    handleSubmit,
    isValid:
      userName &&
      !nameStatus.error &&
      !nameStatus.isChecking &&
      /^\d{8}$/.test(formData.iidxId.replace(/-/g, "")),
  };
};
