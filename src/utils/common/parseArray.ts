export const parseArray = (val: unknown) =>
  Array.isArray(val) ? val : val ? [val] : [];
