import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  rightElement?: React.ReactNode;
}

export const PageHeader = ({
  title,
  description,
  icon,
  rightElement,
}: PageHeaderProps) => (
  <Box
    position="relative"
    overflow="hidden"
    bg="gray.950"
    borderBottom="1px solid"
    borderColor="whiteAlpha.100"
    pt={{ base: 8, md: 12 }}
    pb={{ base: 6, md: 8 }}
    px={4}
    mb={6}
  >
    <Box
      position="absolute"
      top="-20%"
      left="-10%"
      w="40%"
      h="150%"
      bg="blue.900"
      filter="blur(120px)"
      opacity="0.15"
      pointerEvents="none"
    />

    <Container maxW="container.xl">
      <HStack justify="space-between" align="flex-end" gap={4}>
        <VStack align="start" gap={2} flex={1}>
          <HStack gap={3}>
            {icon && (
              <Box
                p={2}
                bg="blue.950"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="blue.800"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={icon} size="md" color="blue.400" />
              </Box>
            )}
            <Heading
              size="2xl"
              fontWeight="bold"
              letterSpacing="tight"
              color="white"
              lineHeight="1.1"
            >
              {title}
            </Heading>
          </HStack>

          {description && (
            <Text
              fontSize="md"
              color="whiteAlpha.600"
              maxW="2xl"
              fontWeight="medium"
              pl={icon ? "52px" : "0"}
              display={{ base: "none", sm: "block" }}
            >
              {description}
            </Text>
          )}
        </VStack>

        {rightElement && <Box pb={1}>{rightElement}</Box>}
      </HStack>
    </Container>
  </Box>
);

export const PageContainer = ({ children }: { children: ReactNode }) => (
  <Container maxW="svw" mx="auto" px={{ base: 3, md: 8, lg: 16 }} py={4}>
    {children}
  </Container>
);
