export const formatIIDXId = (str: string | undefined) => {
  return (str || "").replace(/^(\d{4})(\d{4})$/, "$1-$2");
};
