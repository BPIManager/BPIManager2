import { Box, Grid, Text, HStack, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import dayjs from "@/lib/dayjs";

interface ActivityData {
  date: string;
  count: number;
}

const getActivityColor = (count: number) => {
  if (count === 0) return "#161b22";
  if (count <= 5) return "#0e4429";
  if (count <= 15) return "#006d32";
  if (count <= 30) return "#26a641";
  return "#39d353";
};

export const ActivityCalendar = ({ data }: { data: ActivityData[] }) => {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const calendarDays = useMemo(() => {
    const days = [];

    const lastDate =
      data.length > 0 ? dayjs(data[data.length - 1].date).tz() : dayjs().tz();

    const endOfCalendar = lastDate.endOf("week");

    const dataMap = new Map(
      data.map((d) => [dayjs(d.date).tz().format("YYYY-MM-DD"), d.count]),
    );

    for (let i = 364; i >= 0; i--) {
      const dateObj = endOfCalendar.subtract(i, "day");
      const dateStr = dateObj.tz().format("YYYY-MM-DD");
      days.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0,
        dayOfWeek: dateObj.day(),
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
    <Box
      p={5}
      bg="#0d1117"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      w="full"
    >
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
            <Box h="12px">
              <Text transform="scale(0.8)">Mon</Text>
            </Box>
            <Box h="12px" />
            <Box h="12px">
              <Text transform="scale(0.8)">Wed</Text>
            </Box>
            <Box h="12px" />
            <Box h="12px">
              <Text transform="scale(0.8)">Fri</Text>
            </Box>
            <Box h="12px" />
          </VStack>
          <Grid
            templateRows="repeat(7, 1fr)"
            templateColumns="repeat(53, 1fr)"
            autoFlow="column"
            gap="3px"
            flex="1"
          >
            {calendarDays.map((day) => (
              <Tooltip
                key={day.date}
                content={`${day.date}: ${day.count} 件`}
                portalled
                showArrow
                open={activeDate === day.date}
              >
                <Box
                  w="11px"
                  h="11px"
                  onMouseEnter={() => setActiveDate(day.date)}
                  onMouseLeave={() => setActiveDate(null)}
                  onClick={() =>
                    setActiveDate(activeDate === day.date ? null : day.date)
                  }
                  bg={getActivityColor(day.count)}
                  borderRadius="2px"
                  transition="all 0.2s"
                  _hover={{
                    transform: "scale(1.2)",
                    zIndex: 1,
                    boxShadow: "0 0 8px rgba(57, 211, 83, 0.4)",
                  }}
                />
              </Tooltip>
            ))}
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
            bg={getActivityColor(v)}
            borderRadius="2px"
          />
        ))}
        <Text>More</Text>
      </HStack>
    </Box>
  );
};
