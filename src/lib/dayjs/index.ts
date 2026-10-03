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

/** JST基準の今日の日付を YYYY-MM-DD 形式で返す */
export const todayJst = (): string => dayjs().tz().format("YYYY-MM-DD");
