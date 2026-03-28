/**
 * アプリ共通の dayjs インスタンス。
 * UTC・タイムゾーン・相対時間・日本語ロケールの各プラグインを適用済みで、
 * デフォルトタイムゾーンを `Asia/Tokyo` に設定している。
 *
 * @module
 */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ja";

dayjs.extend(relativeTime);
dayjs.locale("ja");
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

export default dayjs;
