type TopElementEntry = { title: string; difficulty: string; top: string };

// eslint-disable-next-line @typescript-eslint/no-require-imports
const topElements: TopElementEntry[] = require("./topElements.json");
export default topElements;
