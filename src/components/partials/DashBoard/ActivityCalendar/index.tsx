import { Box, Grid, Text, HStack, VStack, Button } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "@/lib/dayjs";
import NextLink from "next/link";
import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DashCard } from "@/components/ui/dashcard";

interface ActivityData {
  date: string;
  count: number;
}

const getActivityColor = (count: number, isFuture: boolean) => {
  if (isFuture) return "transparent";
  if (count === 0) return "#161b22";
  if (count <= 5) return "#0e4429";
  if (count <= 15) return "#006d32";
  if (count <= 30) return "#26a641";
  return "#39d353";
};

interface Props {
  data: ActivityData[];
  userId: string;
  version: string;
}

export const ActivityCalendar = ({ data, userId, version }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const isTouchDevice =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

  const calendarDays = useMemo(() => {
    const days = [];
    const today = dayjs().tz().startOf("day");
    const endOfCalendar = dayjs().tz().endOf("week");

    const dataMap = new Map(
      data.map((d) => [dayjs(d.date).tz().format("YYYY-MM-DD"), d.count]),
    );

    for (let i = 370; i >= 0; i--) {
      const dateObj = endOfCalendar.subtract(i, "day");
      const dateStr = dateObj.format("YYYY-MM-DD");
      const isFuture = dateObj.isAfter(today, "day");

      days.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0,
        dayOfWeek: dateObj.day(),
        isFuture: isFuture,
      });
    }
    return days;
  }, [data]);

  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      container.scrollLeft = container.scrollWidth;
    }
  }, [calendarDays]);

  return (
    <DashCard>
      <Text fontSize="sm" fontWeight="bold" mb={4} color="gray.400">
        最近の更新
      </Text>

      <Box
        ref={scrollRef}
        overflowX="auto"
        pb={2}
        css={{
          "&::-webkit-scrollbar": { height: "4px" },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
          },
        }}
      >
        <HStack align="start" gap={3} minW="720px">
          <VStack gap={0} pt={6} fontSize="10px" color="gray.500" align="start">
            {["Mon", "Wed", "Fri"].map((day, idx) => (
              <Box key={day} h="24px" display="flex" alignItems="center">
                <Text transform="scale(0.8)">{day}</Text>
              </Box>
            ))}
          </VStack>

          <Grid
            templateRows="repeat(7, 1fr)"
            templateColumns="repeat(53, 1fr)"
            autoFlow="column"
            gap="3px"
            flex="1"
          >
            {calendarDays.map((day) => {
              const isOpen = hoveredDate === day.date;

              return (
                <PopoverRoot
                  key={day.date}
                  open={isOpen}
                  onOpenChange={(e) => {
                    if (!e.open) setHoveredDate(null);
                  }}
                  positioning={{ placement: "top" }}
                  portalled
                >
                  <PopoverTrigger asChild>
                    <Box
                      w="11px"
                      h="11px"
                      bg={getActivityColor(day.count, day.isFuture)}
                      borderRadius="2px"
                      cursor={day.isFuture ? "default" : "pointer"}
                      onMouseEnter={() => {
                        if (!isTouchDevice && !day.isFuture)
                          setHoveredDate(day.date);
                      }}
                      onMouseLeave={() => {
                        if (!isTouchDevice) setHoveredDate(null);
                      }}
                      onClick={(e) => {
                        if (day.isFuture) return;
                        e.stopPropagation();
                        setHoveredDate(isOpen ? null : day.date);
                      }}
                      transition="all 0.2s"
                      _hover={
                        !day.isFuture
                          ? {
                              transform: "scale(1.2)",
                              zIndex: 1,
                              boxShadow: "0 0 8px rgba(57, 211, 83, 0.4)",
                            }
                          : {}
                      }
                    />
                  </PopoverTrigger>

                  <PopoverContent
                    bg="gray.800"
                    color="white"
                    borderColor="whiteAlpha.200"
                    p={2}
                    w="auto"
                    onMouseEnter={() => setHoveredDate(day.date)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    <PopoverArrow bg="gray.800" />
                    <PopoverBody>
                      <VStack align="stretch" gap={2}>
                        <Text
                          fontSize="xs"
                          fontWeight="bold"
                          whiteSpace="nowrap"
                          color="white"
                        >
                          {day.date}: {day.count} 件
                        </Text>
                        <Button
                          asChild
                          size="xs"
                          colorPalette="blue"
                          h="24px"
                          fontSize="10px"
                        >
                          <NextLink
                            href={`/users/${userId}/logs/${version}/summary/${day.date}?groupedBy=lastPlayed`}
                          >
                            サマリを表示
                          </NextLink>
                        </Button>
                      </VStack>
                    </PopoverBody>
                  </PopoverContent>
                </PopoverRoot>
              );
            })}
          </Grid>
        </HStack>
      </Box>

      <HStack justify="end" mt={3} gap={1} fontSize="10px" color="gray.500">
        <Text>Less</Text>
        {[0, 5, 15, 30, 50].map((v) => (
          <Box
            key={v}
            w="10px"
            h="10px"
            bg={getActivityColor(v, false)}
            borderRadius="2px"
          />
        ))}
        <Text>More</Text>
      </HStack>
    </DashCard>
  );
};
