import type { GetServerSideProps } from "next";

export default function SongDetailIndex() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const songId = params?.songId;
  return {
    redirect: {
      destination: `/songs/${songId}/notes`,
      permanent: false,
    },
  };
};
