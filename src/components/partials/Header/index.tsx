import { Box, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
}

export const PageHeader = ({ title, description }: PageHeaderProps) => (
  <Box bg="gray.800" py={8} px={4} textAlign={"center"}>
    <Heading size="lg" mb={2}>
      {title}
    </Heading>
    {description && <Text color="gray.500">{description}</Text>}
  </Box>
);

export const PageContainer = ({ children }: { children: ReactNode }) => (
  <Container maxW="6xl" mx="auto" px={2} py={4}>
    {children}
  </Container>
);
