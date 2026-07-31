/** BPM文字列(例: "150-300", "180~200")の範囲区切り文字 */
const BPM_RANGE_SEPARATOR = /[-~]/;

export const getMinBpm = (bpmStr: string | null): number => {
  if (!bpmStr) return 0;
  const parts = bpmStr.split(BPM_RANGE_SEPARATOR);
  return parseFloat(parts[0]);
};

export const getMaxBpm = (bpmStr: string | null): number => {
  if (!bpmStr) return 0;
  const parts = bpmStr.split(BPM_RANGE_SEPARATOR);
  return parseFloat(parts[parts.length - 1]);
};

/** BPMが範囲表記(ソフラン曲)かどうかを判定する */
export const isSoflanBpm = (bpmStr: string | null): boolean => {
  if (!bpmStr) return false;
  return BPM_RANGE_SEPARATOR.test(bpmStr);
};
