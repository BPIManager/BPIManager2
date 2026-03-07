// src/pages/my/index.tsx
import { GetServerSideProps } from "next";
import { latestVersion } from "@/constants/latestVersion";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: `/my/${latestVersion}?levels=12%2C11&difficulties=LEGGENDARIA%2CHYPER%2CANOTHER`,
      permanent: false,
    },
  };
};

export default function MyPageRedirect() {
  return null;
}
