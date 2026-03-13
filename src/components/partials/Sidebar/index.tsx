import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Spacer,
  Separator,
  Badge,
  Link as CLink,
  Collapsible,
} from "@chakra-ui/react";
import {
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
  User,
  ChevronRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { useUser } from "@/contexts/users/UserContext";
import { authActions } from "@/lib/firebase/auth";
import Link from "next/link";
import { useRouter } from "next/router";
import { Avatar } from "@/components/ui/avatar";
import { LuLayoutDashboard } from "react-icons/lu";
import { latestVersion } from "@/constants/latestVersion";
import { useState } from "react";

export const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const { user, fbUser } = useUser();
  const router = useRouter();

  const [isRivalOpen, setIsRivalOpen] = useState<boolean>(true);

  const mainMenuItems = [
    { label: "ダッシュボード", icon: LuLayoutDashboard, href: "/" },
    { label: "インポート", icon: FileUp, href: "/import" },
    { label: "スコア一覧", icon: ListIcon, href: "/my" },
    {
      label: "スコア更新ログ",
      icon: ScrollText,
      href: `/user/${user?.userId}/logs/${latestVersion}`,
    },
  ];

  const rivalMenuItems = [
    { label: "ライバル一覧", icon: UsersIcon, href: "/rivals" },
    { label: "タイムライン", icon: ChartNoAxesGantt, href: "/timeline" },
    { label: "ライバルを探す", icon: Search, href: "/users" },
  ];

  const otherMenuItems = [
    { label: "分析", icon: ChartArea, href: "/analytics", isComingSoon: true },
    { label: "メモ", icon: StickyNote, href: "/notes", isComingSoon: true },
    { label: "指標", icon: LandPlot, href: "/metrics" },
    { label: "設定", icon: Settings, href: "/settings" },
  ];

  const renderMenuItem = (item: any, isNested = false) => {
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
          pl={isNested ? 8 : 2}
          onClick={onClose}
          size="sm"
          width="full"
        >
          <item.icon size={18} />
          <Text fontWeight={isActive ? "bold" : "medium"}>{item.label}</Text>
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
  };

  return (
    <VStack align="stretch" p={4} gap={6} h="full" minH="0" overflowY="auto">
      <Box
        p={4}
        borderRadius="xl"
        color="white"
        bg="whiteAlpha.50"
        borderWidth="1px"
        borderColor="whiteAlpha.100"
      >
        <VStack gap={4} align="stretch">
          <HStack gap={3}>
            <Link href={"/user/" + user?.userId}>
              <Avatar
                size="lg"
                src={user?.profileImage || ""}
                name={user?.userName || "User"}
                shape="rounded"
              />
            </Link>
            <Box minW={0}>
              <Text fontWeight="bold" fontSize="md" lineClamp={1}>
                {user?.userName || "Guest"}
              </Text>
              <Text
                fontSize="2xs"
                color="fg.muted"
                fontFamily="mono"
                lineClamp={1}
              >
                {user?.iidxId ? `ID: ${user.iidxId}` : "ID未設定"}
              </Text>
              <Text
                fontSize="2xs"
                color="orange.300"
                fontWeight="bold"
                fontFamily="mono"
              >
                ☆12 BPI: {user?.totalBpi ?? -15}
              </Text>
            </Box>
          </HStack>

          {user?.userId && (
            <Button
              asChild
              variant="outline"
              size="xs"
              width="full"
              borderColor="gray.600"
              justifyContent="space-between"
              onClick={onClose}
              px={2}
            >
              <Link href={`/user/${user?.userId}`}>
                <HStack gap={1}>
                  <User size={12} />
                  <Text fontSize="2xs">プロフィールを表示</Text>
                </HStack>
                <ChevronRight size={12} />
              </Link>
            </Button>
          )}

          {user?.userId && (
            <HStack gap={10} justify="center" cursor="default" px={1}>
              <Link href={`/user/${user?.userId}/following`} passHref>
                <VStack gap={0} align="center">
                  <Text fontSize="xs" fontWeight="bold">
                    {user?.followingCount ?? 0}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted">
                    フォロー
                  </Text>
                </VStack>
              </Link>

              <Link href={`/user/${user?.userId}/followers`} passHref>
                <VStack gap={0} align="center">
                  <Text fontSize="xs" fontWeight="bold">
                    {user?.followerCount ?? 0}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted">
                    フォロワー
                  </Text>
                </VStack>
              </Link>
            </HStack>
          )}
        </VStack>
      </Box>

      <VStack align="stretch" gap={1}>
        {mainMenuItems.map((item) => renderMenuItem(item))}

        <Box>
          <Button
            variant="ghost"
            width="full"
            justifyContent="start"
            px={2}
            color="whiteAlpha.700"
            _hover={{ bg: "whiteAlpha.100", color: "white" }}
            onClick={() => setIsRivalOpen(!isRivalOpen)}
            gap={3}
          >
            {isRivalOpen ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
            <Text fontSize="sm" fontWeight="bold" letterSpacing="wider">
              ライバル
            </Text>
          </Button>

          <Collapsible.Root open={isRivalOpen}>
            <Collapsible.Content>
              <VStack align="stretch" gap={1} mt={1}>
                {rivalMenuItems.map((item) => renderMenuItem(item, true))}
              </VStack>
            </Collapsible.Content>
          </Collapsible.Root>
        </Box>

        {otherMenuItems.map((item) => renderMenuItem(item))}
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
