import { IIDX_VERSIONS } from "@/constants/latestVersion";

/** バージョン情報の定義 */
export interface VersionTitle {
  num: IIDXVersion;
  title: string;
  default?: boolean;
  disabled?: boolean;
}

export type IIDXVersion = (typeof IIDX_VERSIONS)[number];
