import { LoginButtons } from "@/components/partials/LogIn";
import { Container, Heading, Separator, Text } from "@chakra-ui/react";
import { Accordion, Span } from "@chakra-ui/react";

export default function LoginPage() {
  return (
    <Container maxW="4xl" mx="auto" px={4}>
      <Heading fontSize={"2xl"} textAlign={"center"} my={4}>
        BPIM2
      </Heading>
      <Text textAlign={"center"} fontSize={"sm"}>
        BPIM2は、beatmaniaIIDX上級者向けのスコア管理ツールです。
      </Text>
      <LoginButtons />
      <Separator color="whiteAlpha.400" my={4} />
      <Heading fontSize={"2xl"} textAlign={"center"} my={4}>
        What's BPM2
      </Heading>
      <WhatsBPIM2 />
    </Container>
  );
}

const WhatsBPIM2 = () => {
  return (
    <Accordion.Root collapsible defaultValue={["b"]}>
      {items.map((item, index) => (
        <Accordion.Item key={index} value={item.value}>
          <Accordion.ItemTrigger py={2}>
            <Span flex="1">{item.title}</Span>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent fontSize="xs">
            <Accordion.ItemBody>{item.text}</Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
};

const items = [
  {
    value: "a",
    title: "BPIManagerとの違いは?",
    text: (
      <>
        BPIManagerではスコアを端末に保存していましたが、BPIM2ではサーバーにスコアを保存します。
        <br />
        そのため、ブラウザキャッシュの削除などのタイミングにおける意図しないデータ消失がなくなります。
      </>
    ),
  },
  {
    value: "b",
    title: "BPIManagerからの移行方法は?",
    text: (
      <>
        BPIManagerとアカウント情報を共有しているため、BPIManagerでお使いの連携方法でサインインしてください。
        <br />
        BPIManagerでSyncを用いてデータ同期頂いていた場合、これらのデータをBPIM2に引き継ぐことができます。
      </>
    ),
  },
  {
    value: "c",
    title: "どんな機能が提供されますか?",
    text: (
      <>
        BPIM2では、スコア管理に特化したクリティカルな機能を提供します。
        <br />
        REST
        APIを提供しており、お好きな形でご自身またはスコアを公開している他のユーザーのスコアを分析いただくことができます。
        <br />
        (スコアを非公開に設定している場合は、他人にスコアを見られる心配はありません)
        <br />
        <br />
        また、BPIManagerでは設計上計算コストの高かったアリーナランク別平均やBPIMユーザー間における横断指標などを提供予定です。
      </>
    ),
  },
];
