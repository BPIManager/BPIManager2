/**
 * 県別1位ターゲットの`param`（`<topranker version>_<areaId>`）の組み立て・分解。
 * `targetCodec`が`:`を区切り文字に使うため、`:`以外の区切りにしている。
 */
export function encodeTopRankerParam(version: string, areaId: number): string {
  return `${version}_${areaId}`;
}

export function decodeTopRankerParam(param: string | undefined): {
  version: string;
  areaId: number | null;
} {
  const [version = "", area] = (param ?? "").split("_");
  const areaId = area === undefined || area === "" ? null : Number(area);
  return { version, areaId: Number.isInteger(areaId) ? areaId : null };
}
