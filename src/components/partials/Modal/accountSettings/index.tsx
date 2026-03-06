import { useState, useEffect } from "react";
import {
  Input,
  Textarea,
  Stack,
  Switch,
  HStack,
  Text,
  Image,
  Circle,
  Box,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { FormSelect } from "@/components/ui/select";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useUser } from "@/contexts/users/UserContext";
import { authActions } from "@/lib/firebase/auth";
import { arenaRanksCollection } from "@/constants/arenaRank";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogFooter,
  DialogCloseTrigger,
} from "@/components/ui/dialog";
import { User2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { ImageUploadModal } from "../ImageCrop/ui";

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AccountSettings({ isOpen, onClose }: Props) {
  const { user, fbUser, refresh, isLoading } = useUser();
  const { isSignedIn } = authActions;
  const [fbUid, setFbUid] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleImageSuccess = (url: string) => {
    setFormData((prev) => ({ ...prev, profileImage: url }));
  };

  const [formData, setFormData] = useState({
    userName: "",
    iidxId: "",
    arenaRank: "-",
    bio: "",
    isPublic: true,
    xId: "",
    profileImage: "",
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
              u.photoURL ||
              `https://api.dicebear.com/9.x/identicon/svg?seed=${u.uid}`,
          }));
        }
      }
    });
  }, []);

  const useServiceIcon = () => {
    const providerPhoto = auth.currentUser?.photoURL;
    setFormData({
      ...formData,
      profileImage:
        providerPhoto ||
        `https://api.dicebear.com/9.x/identicon/svg?seed=${Math.random()}`,
    });
  };

  const useDiceBearIcon = () => {
    setFormData({
      ...formData,
      profileImage: `https://api.dicebear.com/9.x/identicon/svg?seed=${Math.random()}`,
    });
  };

  const validateIidxId = (id: string) => {
    if (!id) return false;
    return /^\d{8}$/.test(id.replace(/-/g, ""));
  };

  const handleSubmit = async () => {
    if (!fbUid || !fbUser) return;

    setIsSubmitting(true);
    try {
      const token = await fbUser.getIdToken();
      const response = await fetch(`/api/${fbUid}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: fbUid,
          userName: formData.userName,
          iidxId: formData.iidxId.replace(/-/g, ""),
          xId: formData.xId,
          arenaRank: formData.arenaRank === "-" ? null : formData.arenaRank,
          profileText: formData.bio || null,
          profileImage: formData.profileImage,
          isPublic: formData.isPublic ? 1 : 0,
        }),
      });

      if (!response.ok) throw new Error("Registration failed");

      await refresh();
      toaster.create({ title: "保存しました", type: "success" });
      if (onClose) onClose();
    } catch (error) {
      toaster.create({
        title: "アカウント情報の反映に失敗しました",
        type: "error",
        closable: true,
      });
    } finally {
      setIsSubmitting(false);
      console.log("b");
      toaster.create({
        title: "Saved",
        closable: true,
      });
    }
  };
  const isForcedOpen = !isLoading && isSignedIn() && !user;
  const finalOpen = isOpen || isForcedOpen;

  return (
    <>
      <DialogRoot
        open={finalOpen}
        placement={{ mdDown: "top", md: "center" }}
        onOpenChange={(e) => {
          if (!e.open && user && onClose) {
            onClose();
          }
        }}
        closeOnInteractOutside={!!user}
      >
        <DialogContent borderRadius="xl" boxShadow="2xl" bg="bg.panel" p={4}>
          {user && (
            <DialogCloseTrigger
              position="absolute"
              top="4"
              right="4"
              onClick={onClose}
            />
          )}
          <DialogHeader borderBottomWidth="1px" pb={4}>
            <HStack>
              <User2Icon color="var(--chakra-colors-blue-500)" />
              <DialogTitle fontSize="xl">プロフィール設定</DialogTitle>
            </HStack>
          </DialogHeader>

          <DialogBody py={3}>
            <Stack gap={6}>
              <Field
                label="アイコンを設定"
                required
                invalid={!formData.userName}
                helperText="公序良俗に反しないアイコンを設定してください"
              >
                <HStack gap={4}>
                  <Circle
                    size="72px"
                    overflow="hidden"
                    border="2px solid"
                    borderColor="blue.500"
                  >
                    <Image src={formData.profileImage} alt="Preview" />
                  </Circle>
                  <Box
                    display="flex"
                    flexDirection={"column"}
                    justifyContent={"start"}
                  >
                    <Button
                      size="xs"
                      variant="outline"
                      p={2}
                      onClick={useServiceIcon}
                    >
                      連携サービスのアイコンを使用
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      p={2}
                      onClick={() => setIsImageModalOpen(true)}
                    >
                      アイコンをアップロード
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      p={2}
                      onClick={useDiceBearIcon}
                    >
                      ランダムに設定
                    </Button>
                  </Box>
                </HStack>
              </Field>

              <Field
                label="表示名"
                required
                invalid={!formData.userName}
                helperText="ユーザー名を設定"
                errorText="ユーザー名は必須です"
              >
                <Input
                  variant="subtle"
                  value={formData.userName}
                  onChange={(e) =>
                    setFormData({ ...formData, userName: e.target.value })
                  }
                  p={2}
                  placeholder=""
                />
              </Field>

              <Field
                label="IIDX ID"
                required
                invalid={!validateIidxId(formData.iidxId)}
                errorText="8桁のIIDXIDを入力してください"
              >
                <Input
                  variant="subtle"
                  value={formData.iidxId}
                  onChange={(e) =>
                    setFormData({ ...formData, iidxId: e.target.value })
                  }
                  p={2}
                  placeholder="00000000"
                />
              </Field>

              <Field
                label="Xユーザー名"
                helperText="Xアカウントをプロフィールに設定できます(オプション)"
              >
                <Input
                  variant="subtle"
                  value={formData.xId}
                  onChange={(e) =>
                    setFormData({ ...formData, xId: e.target.value })
                  }
                  p={2}
                />
              </Field>
              <Field
                label="アリーナランク"
                helperText="現在のアリーナランクを選択してください(アリーナ平均との比較が可能になります)"
              >
                <FormSelect
                  collection={arenaRanksCollection}
                  value={formData.arenaRank}
                  onValueChange={(val) =>
                    setFormData({ ...formData, arenaRank: val })
                  }
                  placeholder="未設定"
                />
              </Field>

              <Field
                label="自己紹介"
                invalid={formData.bio.length > 1000}
                helperText={formData.bio.length + " / 1000"}
                errorText="1000文字以内で入力してください"
              >
                <Textarea
                  variant="subtle"
                  p={2}
                  rows={3}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                />
              </Field>

              <HStack
                justify="space-between"
                p={3}
                bg="blue.900/20"
                borderRadius="md"
              >
                <Box>
                  <Text textStyle="sm" fontWeight="bold">
                    プロフィールを公開
                  </Text>
                  <Text textStyle="xs" color="fg.muted">
                    他のユーザーがあなたを見つけられるようになります
                  </Text>
                  {!formData.isPublic && (
                    <Text textStyle="xs" color="red.400">
                      BPIM2の機能を最大限利用するため、プロフィールの公開を推奨します
                    </Text>
                  )}
                </Box>
                <Switch.Root
                  colorPalette="blue"
                  checked={formData.isPublic}
                  onCheckedChange={(e) =>
                    setFormData({ ...formData, isPublic: !!e.checked })
                  }
                >
                  <Switch.HiddenInput />
                  <Switch.Control />
                  <Switch.Label />
                </Switch.Root>
              </HStack>
            </Stack>
          </DialogBody>

          <DialogFooter borderTopWidth="1px" pt={4}>
            <Button
              width="full"
              size="lg"
              colorPalette="blue"
              loading={isSubmitting}
              onClick={handleSubmit}
              disabled={!formData.userName || !validateIidxId(formData.iidxId)}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
      {fbUid && (
        <ImageUploadModal
          uid={fbUid}
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          onSuccess={handleImageSuccess}
        />
      )}
    </>
  );
}
