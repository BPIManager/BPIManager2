import { IIDXVersion } from "../iidx/version";

export interface StatsQuery {
  userId: string;
  version: IIDXVersion;
  levels: number[];
  difficulties: string[];
}
