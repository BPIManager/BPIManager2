import { GetServerSideProps } from "next";
import { latestVersion } from "@/constants/latestVersion";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: `/logs/${latestVersion}`,
      permanent: false,
    },
  };
};

export default function MyPageRedirect() {
  return null;
}
