import { useState } from "react";
import {
  Input,
  Textarea,
  Stack,
  Switch,
  HStack,
  Text,
  Box,
  Spinner,
  Group,
  InputAddon,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { FormSelect } from "@/components/ui/select";
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
import { ImageUploadModal } from "../ImageCrop/ui";
import { LuCheck, LuX } from "react-icons/lu";
import { useEditProfile } from "@/hooks/users/useEditProfile";
import { AvatarSection } from "./avatar";

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AccountSettings({ isOpen, onClose }: Props) {
  const { user, isLoading } = useUser();
  const { isSignedIn } = authActions;
  const {
    formData,
    setFormData,
    nameStatus,
    fbUid,
    isSubmitting,
    handleSubmit,
    isValid,
  } = useEditProfile(onClose);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const validateIidxId = (id: string) => {
    if (!id) return false;
    return /^\d{8}$/.test(id.replace(/-/g, ""));
  };

  const handleXIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 15);
    setFormData({ ...formData, xId: value });
  };

  const finalOpen = isOpen || (!isLoading && isSignedIn() && !user);

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
              {/* アイコン設定 */}
              <Field
                label="アイコンを設定"
                required
                helperText="公序良俗に反しないアイコンを設定してください"
              >
                <AvatarSection
                  image={formData.profileImage}
                  onChange={(url) =>
                    setFormData({ ...formData, profileImage: url })
                  }
                />
                <Button
                  size="xs"
                  variant="outline"
                  mt={2}
                  onClick={() => setIsImageModalOpen(true)}
                >
                  アイコンをアップロード
                </Button>
              </Field>

              {/* 表示名 */}
              <Field
                label="表示名"
                required
                invalid={!!nameStatus.error}
                helperText={
                  nameStatus.isChecking ? "重複を確認中..." : "ユーザー名を設定"
                }
                errorText={nameStatus.error}
              >
                <Box position="relative" w="full">
                  <Input
                    variant="subtle"
                    value={formData.userName}
                    onChange={(e) =>
                      setFormData({ ...formData, userName: e.target.value })
                    }
                    p={2}
                    pr="40px"
                    placeholder="Player Name"
                  />
                  <Box
                    position="absolute"
                    right="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    zIndex={2}
                  >
                    {nameStatus.isChecking ? (
                      <Spinner size="xs" color="blue.500" />
                    ) : formData.userName && !nameStatus.error ? (
                      <LuCheck color="var(--chakra-colors-green-500)" />
                    ) : nameStatus.error ? (
                      <LuX color="var(--chakra-colors-red-500)" />
                    ) : null}
                  </Box>
                </Box>
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
                helperText="Xアカウントをプロフィールに表示できます(最大15文字)"
              >
                <Group attached w="full">
                  <InputAddon bg="border.subtle" px={2}>
                    @
                  </InputAddon>
                  <Input
                    variant="subtle"
                    value={formData.xId}
                    onChange={handleXIdChange}
                    placeholder="username"
                    p={2}
                    borderLeftRadius="0"
                  />
                </Group>
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
              disabled={!isValid}
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
          onSuccess={(url) => setFormData({ ...formData, profileImage: url })}
        />
      )}
    </>
  );
}
