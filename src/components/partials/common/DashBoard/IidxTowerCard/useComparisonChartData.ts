import { useMemo } from "react";
import dayjs from "@/lib/dayjs";

type Granularity = "day" | "week" | "month";
type TowerPoint = { playDate: string; keyCount: number; scratchCount: number };

/**
 * IIDX TOWERの自分/ライバルの打鍵数推移を、指定した期間・粒度で
 * 日付ごとに集計しチャート用データへ変換する。
 */
export function useComparisonChartData(
  myData: TowerPoint[],
  rivalData: TowerPoint[],
  periodDays: number,
  granularity: Granularity,
) {
  return useMemo(() => {
    const filterAndGroup = (arr: TowerPoint[]) => {
      const filtered =
        periodDays === 0
          ? arr
          : arr.filter((d) =>
              dayjs(d.playDate).isAfter(dayjs().subtract(periodDays, "day")),
            );

      const groups = new Map<string, { key: number; scr: number }>();
      filtered.forEach((d) => {
        const dateKey = dayjs(d.playDate)
          .startOf(granularity)
          .format("YYYY-MM-DD");
        const existing = groups.get(dateKey) || { key: 0, scr: 0 };
        groups.set(dateKey, {
          key: existing.key + d.keyCount,
          scr: existing.scr + d.scratchCount,
        });
      });
      return groups;
    };

    const myGroups = filterAndGroup(myData);
    const rivalGroups = filterAndGroup(rivalData);

    const myTotals = { key: 0, scratch: 0 };
    myGroups.forEach((v) => {
      myTotals.key += v.key;
      myTotals.scratch += v.scr;
    });
    const rivalTotals = { key: 0, scratch: 0 };
    rivalGroups.forEach((v) => {
      rivalTotals.key += v.key;
      rivalTotals.scratch += v.scr;
    });

    const allDateKeys = Array.from(
      new Set([...myGroups.keys(), ...rivalGroups.keys()]),
    ).sort();

    const maxKey = Math.max(
      ...allDateKeys.map((d) =>
        Math.max(myGroups.get(d)?.key || 0, rivalGroups.get(d)?.key || 0),
      ),
    );
    const maxScr = Math.max(
      ...allDateKeys.map((d) =>
        Math.max(myGroups.get(d)?.scr || 0, rivalGroups.get(d)?.scr || 0),
      ),
    );

    const scratchScale = maxKey > 0 && maxScr > 0 ? maxKey / maxScr : 1;

    const chartData = allDateKeys.map((dateKey) => {
      const myVal = myGroups.get(dateKey);
      const rivalVal = rivalGroups.get(dateKey);

      let label = dayjs(dateKey).format("MM/DD");
      if (granularity === "month") label = dayjs(dateKey).format("YY/MM");
      if (granularity === "week") label = `${dayjs(dateKey).format("MM/DD")}~`;

      const rawMyScr = myVal?.scr || 0;
      const rawRivalScr = rivalVal?.scr || 0;

      return {
        date: label,
        myKey: myVal?.key || 0,
        rivalKey: rivalVal?.key || 0,
        myScr: rawMyScr > 0 ? -(rawMyScr * scratchScale) : 0,
        rivalScr: rawRivalScr > 0 ? -(rawRivalScr * scratchScale) : 0,
        rawMyScr,
        rawRivalScr,
      };
    });

    return { myTotals, rivalTotals, chartData, scratchScale };
  }, [myData, rivalData, periodDays, granularity]);
}
