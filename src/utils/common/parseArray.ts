export const parseArray = (val: any) =>
  Array.isArray(val) ? val : val ? [val] : [];
