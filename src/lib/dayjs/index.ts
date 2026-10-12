/**
 * UTC・タイムゾーン・相対時間・日本語ロケールのプラグインを適用済みの共通 dayjs。既定タイムゾーンは Asia/Tokyo。
 * @module
 */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import isoWeek from "dayjs/plugin/isoWeek";
import "dayjs/locale/ja";

dayjs.extend(relativeTime);
dayjs.extend(isoWeek);
dayjs.locale("ja");
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

export default dayjs;

/**
 * クエリの`asOf`（`latest`/未指定、または`YYYY-MM-DD`）を、その時点までのスコアを取る基準時刻に変換する。
 * 日付指定はJSTのその日の終わり（23:59:59.999）として解釈し、指定日当日のプレーを含める。
 *
 * @param asOf - `latest`・未指定、または`YYYY-MM-DD`
 */
export const resolveAsOfTime = (asOf?: string): Date =>
  !asOf || asOf === "latest"
    ? dayjs.tz().utc().toDate()
    : dayjs.tz(asOf).endOf("day").utc().toDate();

/** JST基準の今日の日付を YYYY-MM-DD 形式で返す */
export const todayJst = (): string => dayjs().tz().format("YYYY-MM-DD");
