import { VStack, HStack, Text, Box, Button, Spacer } from "@chakra-ui/react";
import { Home, FileUp, Settings, LogOut, ListIcon } from "lucide-react";
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
              {user?.iidxId ? `ID: ${user.iidxId}` : "ID未設定"}
            </Text>
          </Box>
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
