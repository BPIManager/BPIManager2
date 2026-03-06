export const getMaxBpm = (bpmStr: string | null): number => {
  if (!bpmStr) return 0;
  const parts = bpmStr.split("-");
  return parseFloat(parts[parts.length - 1]);
};
