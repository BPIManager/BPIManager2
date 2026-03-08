import {
  Container,
  Stack,
  Box,
  Textarea,
  HStack,
  VStack,
  Button,
  Separator,
  Text,
} from "@chakra-ui/react";
import { Trash2, Upload, AlertCircle, HelpCircle } from "lucide-react";
import { Field } from "@/components/ui/field";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { DashboardLayout } from "@/components/partials/Main";
import { versionsCollection } from "@/constants/versions";
import { InstructionSection } from "./instruction";
import { LoginRequiredCard } from "../../LoginRequired/ui";

interface Props {
  csvData: string;
  setCsvData: (v: string) => void;
  selectedVersion: string[];
  setSelectedVersion: (v: string[]) => void;
  isProcessing: boolean;
  isLoggedIn: boolean;
  processStatus: string;
  onStartImport: () => void;
}

export const ImportView = (props: Props) => (
  <DashboardLayout>
    <Container maxW="full">
      <Stack gap={8}>
        <PageHeader
          title="インポート"
          description="CSVデータをアップロードしてBPIを更新します。"
        />
        <PageContainer>
          <Box position="relative">
            {!props.isLoggedIn ? (
              <LoginRequiredCard />
            ) : (
              <>
                <Stack gap={4}>
                  <Field
                    label="CSVデータ"
                    helperText="データを改変しないですべて貼り付けてください"
                  >
                    <Textarea
                      placeholder="バージョン,タイトル,ジャンル,アーティスト,プレー回数,..."
                      minH="100px"
                      variant="subtle"
                      p={4}
                      fontFamily="mono"
                      fontSize="sm"
                      value={props.csvData}
                      onChange={(e) => props.setCsvData(e.target.value)}
                      borderRadius="lg"
                      _focus={{ borderColor: "blue.500" }}
                    />
                  </Field>

                  <Field
                    label="保存先バージョン"
                    helperText="データを反映させるバージョンを選択してください"
                  >
                    <SelectRoot
                      collection={versionsCollection}
                      value={props.selectedVersion}
                      onValueChange={(details) =>
                        props.setSelectedVersion(details.value)
                      }
                      variant="subtle"
                    >
                      <SelectTrigger>
                        <SelectValueText
                          px={4}
                          placeholder="バージョンを選択"
                        />
                      </SelectTrigger>
                      <SelectContent portalled={false}>
                        {versionsCollection.items.map((v) => (
                          <SelectItem p={2} item={v} key={v.value}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>

                  <HStack justify="space-between">
                    <Button
                      variant="ghost"
                      colorPalette="red"
                      size="sm"
                      onClick={() => props.setCsvData("")}
                      disabled={!props.csvData || props.isProcessing}
                    >
                      <Trash2 /> 入力をクリア
                    </Button>
                    <Button
                      colorPalette="blue"
                      size="lg"
                      px={4}
                      loading={props.isProcessing}
                      loadingText={props.processStatus}
                      onClick={props.onStartImport}
                      disabled={props.isProcessing}
                    >
                      <Upload /> インポートを開始
                    </Button>
                  </HStack>
                </Stack>

                <HStack
                  my={4}
                  p={4}
                  borderRadius="lg"
                  bg="whiteAlpha.50"
                  align="start"
                >
                  <AlertCircle size={18} style={{ marginTop: "2px" }} />
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" fontWeight="bold">
                      Note
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      CSVデータはクリップボードから読み取ることもできます。
                      <br />
                      <b>データの更新には最大1分程度かかります。</b>
                    </Text>
                  </VStack>
                </HStack>

                <Separator color="whiteAlpha.200" />
                <InstructionSection />
              </>
            )}
          </Box>
        </PageContainer>
      </Stack>
    </Container>
  </DashboardLayout>
);
