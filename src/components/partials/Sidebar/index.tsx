import {
  VStack,
  HStack,
  Text,
  Box,
  Button,
  Spacer,
  Separator,
  Badge,
  Link as CLink,
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
  Github,
} from "lucide-react";
import { useUser } from "@/contexts/users/UserContext";
import { authActions } from "@/lib/firebase/auth";
import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar } from "@/components/ui/avatar";
import { LuLayoutDashboard } from "react-icons/lu";
import { latestVersion } from "@/constants/latestVersion";

export const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const { user, fbUser } = useUser();
  const router = useRouter();
  const menuItems = [
    { label: "ダッシュボード", icon: LuLayoutDashboard, href: "/" },
    { label: "インポート", icon: FileUp, href: "/import" },
    { label: "スコア一覧", icon: ListIcon, href: "/my" },
    {
      label: "スコア更新ログ",
      icon: ScrollText,
      href: `/user/${user?.userId}/logs/${latestVersion}`,
    },
    {
      label: "フォロータイムライン",
      icon: ChartNoAxesGantt,
      href: "/timeline",
      isComingSoon: true,
    },
    {
      label: "ライバルを探す",
      icon: UsersIcon,
      href: "/find",
      isComingSoon: true,
    },
    { label: "分析", icon: ChartArea, href: "/analytics", isComingSoon: true },
    { label: "メモ", icon: StickyNote, href: "/notes", isComingSoon: true },
    { label: "指標", icon: LandPlot, href: "/metrics" },
    { label: "設定", icon: Settings, href: "/settings" },
  ];
  return (
    <VStack align="stretch" p={4} gap={6} h="full" minH="0" overflowY="auto">
      <Box p={4} borderRadius="xl" color="white">
        <VStack gap={3} align="start">
          <Link href={"/user/" + fbUser?.uid}>
            <Avatar
              size="lg"
              src={user?.profileImage || ""}
              name={user?.userName || "User"}
              shape="rounded"
            />
          </Link>
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
          {user?.userId && (
            <HStack gap={4} justify="start" opacity={0.6} cursor="default">
              <VStack gap={0} align="start">
                <Text fontSize="xs" fontWeight="bold">
                  {user?.followingCount ?? 0}
                </Text>
                <Text fontSize="2xs" color="fg.muted">
                  フォロー中
                </Text>
              </VStack>

              <VStack gap={0} align="start">
                <Text fontSize="xs" fontWeight="bold">
                  {user?.followerCount ?? 0}
                </Text>
                <Text fontSize="2xs" color="fg.muted">
                  フォロワー
                </Text>
              </VStack>
            </HStack>
          )}
        </VStack>
      </Box>

      <VStack align="stretch" gap={1}>
        {menuItems.map((item) => {
          const isActive =
            item.href === "/"
              ? router.asPath === "/"
              : router.asPath.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} passHref legacyBehavior>
              <Button
                as={item.isComingSoon ? "button" : "a"}
                variant={isActive ? "surface" : "ghost"}
                color="#fff"
                colorPalette={isActive ? "blue" : "gray"}
                disabled={item.isComingSoon}
                justifyContent="start"
                gap={3}
                px={2}
                onClick={onClose}
              >
                <item.icon size={18} />
                <Text fontWeight={isActive ? "bold" : "medium"}>
                  {item.label}
                </Text>
                {item.isComingSoon && (
                  <Badge
                    variant="subtle"
                    colorPalette="gray"
                    fontSize="2xs"
                    ml="auto"
                  >
                    近日公開
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </VStack>

      <Spacer />
      <GitHubButton />
      {user?.userId && (
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
      )}
    </VStack>
  );
};

export const GitHubButton = () => {
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      borderRadius="full"
      px={4}
      color="white"
      _hover={{
        bg: "whiteAlpha.200",
        borderColor: "whiteAlpha.400",
      }}
      transition="all 0.2s"
    >
      <CLink
        href="https://github.com/BPIManager/BPIManager2"
        target="_blank"
        rel="noopener noreferrer"
        textDecoration="none"
        display="flex"
        alignItems="center"
        gap={2}
      >
        <Github size={16} />
        <Text fontSize="xs" fontWeight="bold">
          Available on <Text as="span">GitHub</Text>
        </Text>
      </CLink>
    </Button>
  );
};
