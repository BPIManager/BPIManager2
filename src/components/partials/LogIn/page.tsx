import { LoginButtons } from "@/components/partials/LogIn";
import {
  Container,
  Heading,
  Text,
  VStack,
  Box,
  SimpleGrid,
  Icon,
  Badge,
  HStack,
  Stack,
  Separator,
} from "@chakra-ui/react";
import {
  Zap,
  Database,
  BarChart3,
  ArrowRightLeft,
  ShieldCheck,
  Cpu,
  UsersIcon,
} from "lucide-react";
import { Meta } from "../Head";
import { DashboardLayout } from "../Main";
import { PageContainer } from "../Header";

export default function LoginPage() {
  return (
    <DashboardLayout>
      <Meta
        title=""
        description="beatmania IIDX 上級者のためのクラウドベース・スコアマネジメントプラットフォーム"
      />
      <Box bg="black" minH="100svh" color="white" py={20}>
        <PageContainer>
          <VStack gap={6} textAlign="center" mb={16}>
            <Heading
              fontSize={{ base: "4xl", md: "6xl" }}
              fontWeight="black"
              letterSpacing="tighter"
              lineHeight="1"
              bgGradient="to-br"
              gradientFrom="white"
              gradientTo="gray.600"
              bgClip="text"
            >
              BPIM2
            </Heading>
            <Text
              color="fg.muted"
              fontSize={{ base: "md", md: "md" }}
              maxW="2xl"
            >
              beatmania IIDX
              上級者のためのクラウドベース・スコアマネジメントプラットフォーム
            </Text>
          </VStack>

          <Box
            maxW="md"
            mx="auto"
            p={8}
            borderRadius="2xl"
            bg="gray.950"
            border="1px solid"
            borderColor="whiteAlpha.200"
            boxShadow="0 0 40px rgba(0,0,0,0.5), 0 0 20px rgba(49, 130, 206, 0.1)"
            mb={12}
          >
            <VStack gap={6}>
              <VStack gap={1}>
                <Text fontWeight="bold" fontSize="xl">
                  Sign In
                </Text>
              </VStack>
              <LoginButtons />
              <Text fontSize="12px" color="gray.600" textAlign="center">
                ログインすることで利用規約に同意したものとみなされます
              </Text>
            </VStack>
          </Box>

          <Separator mb={16} opacity={0.1} />

          <Heading
            size="lg"
            mb={10}
            textAlign="center"
            letterSpacing="widest"
            fontWeight="black"
          >
            BPIM2って？
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
            <FeatureCard
              icon={Database}
              title="Cloud Storage"
              description="スコアデータはすべてサーバーに保存されるため、旧BPIMで発生していた意図しない消失は完全に解消されました。"
            />
            <FeatureCard
              icon={ArrowRightLeft}
              title="BPIM Legacy Sync"
              description="前作BPIManagerのアカウント情報をそのまま利用可能。Syncデータもスムーズに引き継げます。"
            />
            <FeatureCard
              icon={Cpu}
              title="Advanced Metrics"
              description="アリーナランク別平均や横断指標など、設計を一新したことで、従来にない高度な分析を提供します。"
            />
            <FeatureCard
              icon={BarChart3}
              title="Developer API"
              description="REST APIを公開しており、自分の、あるいは公開されているライバルのデータを自由に外部から解析できます。"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Privacy Control"
              description="スコアの公開状態は完全に制御可能。安心して自身のデータに集中できます。"
            />
            <FeatureCard
              icon={UsersIcon}
              title="Rival Tracking"
              description="実力が近いユーザーを見つけだし、スコアの更新状況をリアルタイムにタイムライン形式で追いかけられます。競い合うことで限界を突破しましょう。"
            />
          </SimpleGrid>
        </PageContainer>
      </Box>
    </DashboardLayout>
  );
}

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <VStack
    align="start"
    p={6}
    bg="whiteAlpha.50"
    borderRadius="xl"
    border="1px solid"
    borderColor="whiteAlpha.100"
    transition="all 0.3s"
    _hover={{
      transform: "translateY(-5px)",
      borderColor: "blue.500/50",
      bg: "whiteAlpha.100",
    }}
  >
    <Box p={3} bg="blue.500/10" borderRadius="lg" color="blue.400" mb={2}>
      <Icon as={icon} size={"xl"} />
    </Box>
    <Text fontWeight="black" fontSize="md" color="white">
      {title}
    </Text>
    <Text fontSize="xs" color="gray.500" lineHeight="tall">
      {description}
    </Text>
  </VStack>
);
