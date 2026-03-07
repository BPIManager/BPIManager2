import {
  Box,
  HStack,
  Stack,
  Text,
  BoxProps,
  HTMLChakraProps,
  Link,
} from "@chakra-ui/react";
import { ChevronRight, LucideIcon } from "lucide-react";
import React from "react";
import NextLink from "next/link";

interface MenuItemProps extends HTMLChakraProps<"a"> {
  icon: LucideIcon;
  title: string;
  subtitle?: string | React.ReactNode;
  iconColor?: string;
  href?: string;
  isExternal?: boolean;
}

export const ReusableMenuItem = ({
  icon: IconComponent,
  title,
  subtitle,
  iconColor = "blue.500",
  href,
  isExternal,
  ...props
}: MenuItemProps) => {
  return (
    <Link
      width="full"
      p="4"
      as={!isExternal ? NextLink : href ? "a" : "button"}
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      display="block"
      borderRadius="lg"
      transition="all 0.2s"
      borderColor="gray.800"
      borderWidth="thin"
      _hover={{ bg: "gray.800", cursor: "pointer", textDecoration: "none" }}
      data-group
      {...props}
    >
      <HStack gap="4" width="full">
        <Box color={iconColor}>
          <IconComponent size={24} />
        </Box>

        <Stack gap="0" flex="1" textAlign="left">
          <Text fontWeight="semibold" fontSize="md" color="fg">
            {title}
          </Text>
          {subtitle && (
            <Text fontSize="xs" color="fg.muted">
              {subtitle}
            </Text>
          )}
        </Stack>

        <Box
          transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          _groupHover={{ transform: "translateX(4px)" }}
          color="fg.subtle"
        >
          <ChevronRight size={20} />
        </Box>
      </HStack>
    </Link>
  );
};
