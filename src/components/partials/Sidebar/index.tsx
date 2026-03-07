import {
  VStack,
  HStack,
  Text,
  Box,
  Button,
  Spacer,
  Separator,
} from "@chakra-ui/react";
import {
  Home,
  FileUp,
  Settings,
  LogOut,
  ListIcon,
  ChartNoAxesGantt,
  LandPlot,
  ChartArea,
  StickyNote,
  UsersIcon,
  ScrollText,
} from "lucide-react";
import { useUser } from "@/contexts/users/UserContext";
import { authActions } from "@/lib/firebase/auth";
import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar } from "@/components/ui/avatar";
import { LuLayoutDashboard } from "react-icons/lu";

export const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const { user, fbUser } = useUser();
  const router = useRouter();

  const menuItems = [
    { label: "ダッシュボード", icon: LuLayoutDashboard, href: "/" },
    { label: "スコア一覧", icon: ListIcon, href: "/my" },
    { label: "インポート", icon: FileUp, href: "/import" },
    { label: "タイムライン", icon: ChartNoAxesGantt, href: "/timeline" },
    { label: "ライバルを探す", icon: UsersIcon, href: "/find" },
    { label: "分析", icon: ChartArea, href: "/analytics" },
    { label: "指標", icon: LandPlot, href: "/metrics" },
    //{ label: "メモ", icon: StickyNote, href: "/notes" },
    { label: "更新ログ", icon: ScrollText, href: "/logs" },
    { label: "設定", icon: Settings, href: "/settings" },
  ];

  return (
    <VStack align="stretch" h="full" p={4} gap={6}>
      <Box p={4} borderRadius="xl" bg="bg.muted">
        <VStack gap={3} align="start">
          <Avatar
            size="lg"
            src={user?.profileImage || fbUser?.photoURL || ""}
            name={user?.userName || fbUser?.displayName || "User"}
            shape="rounded"
          />
          <Box>
            <Text fontWeight="bold" fontSize="md" lineClamp={1}>
              {user?.userName || fbUser?.displayName || "Guest"}
            </Text>
            <Text fontSize="xs" color="fg.muted" fontFamily="mono">
              {user?.iidxId ? `IIDX ID: ${user.iidxId}` : "ID未設定"}
            </Text>
            <Text fontSize="xs" color="fg.muted" fontFamily="mono">
              ☆12総合BPI:{user?.totalBpi ?? -15}
            </Text>
          </Box>
          <Separator colorPalette="gray" opacity={0.5} />

          <HStack gap={4} justify="start">
            <Link href={`/profile/${user?.userId}/following`} onClick={onClose}>
              <VStack
                gap={0}
                align="start"
                _hover={{ color: "blue.400" }}
                transition="color 0.2s"
              >
                <Text fontSize="xs" fontWeight="bold">
                  {user?.followingCount ?? 0}
                </Text>
                <Text fontSize="2xs" color="fg.muted">
                  フォロー中
                </Text>
              </VStack>
            </Link>

            <Link href={`/profile/${user?.userId}/followers`} onClick={onClose}>
              <VStack
                gap={0}
                align="start"
                _hover={{ color: "blue.400" }}
                transition="color 0.2s"
              >
                <Text fontSize="xs" fontWeight="bold">
                  {user?.followerCount ?? 0}
                </Text>
                <Text fontSize="2xs" color="fg.muted">
                  フォロワー
                </Text>
              </VStack>
            </Link>
          </HStack>
        </VStack>
      </Box>

      <VStack align="stretch" gap={1}>
        {menuItems.map((item) => {
          const isActive = router.asPath === item.href;

          return (
            <Link key={item.href} href={item.href} passHref legacyBehavior>
              <Button
                as="a"
                variant={isActive ? "surface" : "ghost"}
                colorPalette={isActive ? "blue" : "gray"}
                justifyContent="start"
                gap={3}
                px={2}
                onClick={onClose}
              >
                <item.icon size={18} />
                <Text fontWeight={isActive ? "bold" : "medium"}>
                  {item.label}
                </Text>
              </Button>
            </Link>
          );
        })}
      </VStack>

      <Spacer />

      <Button
        variant="ghost"
        colorPalette="red"
        size="sm"
        gap={2}
        onClick={() => authActions.logout()}
      >
        <LogOut size={16} />
        サインアウト
      </Button>
    </VStack>
  );
};
