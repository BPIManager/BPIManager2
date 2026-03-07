import { useState } from "react";
import {
  Container,
  Heading,
  Text,
  Stack,
  Box,
  Button,
  Textarea,
  HStack,
  VStack,
  Separator,
  List,
  Link,
  Spinner,
} from "@chakra-ui/react";
import {
  FileUp,
  Info,
  Upload,
  Trash2,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";
import { Meta } from "@/components/partials/Head";
import { DashboardLayout } from "@/components/partials/Main";
import { iidxUrl } from "@/constants/iidxUrl";
import { versionsCollection, versionTitles } from "@/constants/versions";
import { latestVersion } from "@/constants/latestVersion";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { useUser } from "@/contexts/users/UserContext";
import LoginPage from "@/components/partials/LogIn/page";
import AccountSettings from "@/components/partials/Modal/AccountSettings";
import { dummyCsv } from "@/constants/dummyCsv";
import Papa from "papaparse";
import { PageContainer, PageHeader } from "@/components/partials/Header";
import { IIDX_DIFFICULTIES } from "@/constants/diffs";

export default function ImportPage() {
  const { user, isLoading, fbUser, refresh } = useUser();
  const [csvData, setCsvData] = useState(dummyCsv);
  const [isProcessing, setIsProcessing] = useState(false);
  const defaultVersion =
    versionTitles.find((v) => v.default)?.num || latestVersion;
  const [selectedVersion, setSelectedVersion] = useState<string[]>([
    defaultVersion,
  ]);
  const [processStatus, setProcessStatus] = useState("");
  const handleUpload = async () => {
    if (!csvData.trim() || !fbUser) return;

    setIsProcessing(true);
    setProcessStatus("CSVを解析中...");

    try {
      const parsed = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0) {
        throw new Error("CSVの形式が正しくありません。");
      }

      const targetDiffs = IIDX_DIFFICULTIES;

      const formattedRows = parsed.data.flatMap((row: any) => {
        const title = row["タイトル"];
        const lastPlayed = row["最終プレー日時"];
        if (!title) return [];

        return targetDiffs
          .map((diff) => {
            const level = parseInt(row[`${diff} 難易度`] || "0");
            const clearState = row[`${diff} クリアタイプ`];

            if ((level === 11 || level === 12) && clearState !== "NO PLAY") {
              const missStr = row[`${diff} ミスカウント`];
              const missCount =
                missStr === "---" || !missStr ? null : parseInt(missStr);

              return {
                title: title,
                difficulty: diff,
                exScore: parseInt(row[`${diff} スコア`] || "0"),
                clearState: clearState,
                missCount: missCount,
                lastPlayed: lastPlayed || null,
              };
            }
            return null;
          })
          .filter(Boolean);
      });

      if (formattedRows.length === 0) {
        throw new Error("取り込み可能なスコアデータが見つかりませんでした。");
      }

      setProcessStatus(`${formattedRows.length}件のデータをアップロード中...`);

      const idToken = await fbUser.getIdToken(true);

      const response = await fetch(`/api/${fbUser.uid}/scores/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          version: selectedVersion[0],
          csvRows: formattedRows,
        }),
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(errorDetail.message || "インポートに失敗しました");
      }

      const result = await response.json();

      toaster.create({
        title: "インポート完了",
        description: `${result.updatedCount}件更新されました。`,
        type: "success",
      });

      setCsvData("");
      await refresh();
    } catch (error: any) {
      toaster.create({
        title: "エラーが発生しました",
        description: error.message,
        type: "error",
      });
    } finally {
      setIsProcessing(false);
      setProcessStatus("");
    }
  };

  if (isLoading) {
    return (
      <Container
        maxW={"100vw"}
        w={"100vw"}
        h={"90vh"}
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
      >
        <Spinner />
      </Container>
    );
  }
  if (!fbUser) {
    return <LoginPage />;
  }

  return (
    <>
      {!user && <AccountSettings />}
      <Meta
        title="データインポート"
        description="CSVデータを貼り付けてBPIデータを更新します。"
      />
      <DashboardLayout>
        <Container maxW="full">
          <Stack gap={8}>
            <PageHeader
              title="インポート"
              description="CSVデータをアップロードしてBPIを更新します。"
            />
            <PageContainer>
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
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    borderRadius="lg"
                    _focus={{ borderColor: "blue.500" }}
                  />
                </Field>
                <Field
                  label="保存先バージョン"
                  helperText="データを反映させるバージョンを選択してください(旧作は読み取り専用です)"
                >
                  <SelectRoot
                    collection={versionsCollection}
                    value={selectedVersion}
                    onValueChange={(details) =>
                      setSelectedVersion(details.value)
                    }
                    variant="subtle"
                  >
                    <SelectTrigger>
                      <SelectValueText px={4} placeholder="バージョンを選択" />
                    </SelectTrigger>
                    <SelectContent portalled={false}>
                      {versionsCollection.items.map((version) => (
                        <SelectItem p={2} item={version} key={version.value}>
                          {version.label}
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
                    onClick={() => setCsvData("")}
                    disabled={!csvData || isProcessing}
                  >
                    <Trash2 />
                    入力をクリア
                  </Button>
                  <Button
                    colorPalette="blue"
                    size="lg"
                    px={4}
                    loading={isProcessing}
                    loadingText={processStatus}
                    onClick={handleUpload}
                    disabled={!csvData || isProcessing}
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
                    注意事項
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    最大1分程度、算出に時間を要します。
                  </Text>
                </VStack>
              </HStack>

              <Separator color="whiteAlpha.200" />
              <Box
                p={5}
                borderRadius="xl"
                bg="blue.900/10"
                border="1px solid"
                borderColor="blue.500/20"
              >
                <HStack gap={3} mb={3}>
                  <HelpCircle size={20} color="var(--chakra-colors-blue-500)" />
                  <Text fontWeight="bold" fontSize="lg">
                    インポート方法
                  </Text>
                </HStack>
                <List.Root gap={2} fontSize="sm" variant="plain">
                  <List.Item>
                    <HStack align="start">
                      <Box
                        bg="blue.500"
                        color="white"
                        borderRadius="full"
                        px={2}
                        fontSize="xs"
                      >
                        1
                      </Box>
                      <Text>
                        <Link
                          target="_blank"
                          textDecoration={"underline"}
                          href={iidxUrl}
                        >
                          IIDX公式サイト
                        </Link>
                        にアクセスしてCSVダウンロードページを表示します。
                      </Text>
                    </HStack>
                  </List.Item>
                  <List.Item>
                    <HStack align="start">
                      <Box
                        bg="blue.500"
                        color="white"
                        borderRadius="full"
                        px={2}
                        fontSize="xs"
                      >
                        2
                      </Box>
                      <Text>
                        入力エリアにCSVデータを直接貼り付けてください。
                      </Text>
                    </HStack>
                  </List.Item>
                  <List.Item>
                    <HStack align="start">
                      <Box
                        bg="blue.500"
                        color="white"
                        borderRadius="full"
                        px={2}
                        fontSize="xs"
                      >
                        3
                      </Box>
                      <Text>
                        「インポートを開始」ボタンを押して完了を待ちます。
                      </Text>
                    </HStack>
                  </List.Item>
                </List.Root>
                <HStack
                  gap={3}
                  mt={4}
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
                      ブックマークレットによるインポートおよび手入力による登録は現在サポートされていません。(後日対応するかも)
                    </Text>
                  </VStack>
                </HStack>
              </Box>
              <Separator color="whiteAlpha.200" />
            </PageContainer>
          </Stack>
        </Container>
      </DashboardLayout>
    </>
  );
}
