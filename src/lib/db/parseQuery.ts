export function parseQuery(sql: string, parameters: any[]): string {
  let fullSql = sql;
  parameters.forEach((param) => {
    let value = param;
    if (param instanceof Date) {
      value = `'${param.toISOString().slice(0, 19).replace("T", " ")}'`;
    } else if (typeof param === "string") {
      value = `'${param.replace(/'/g, "''")}'`;
    } else if (param === null) {
      value = "NULL";
    }
    fullSql = fullSql.replace("?", value);
  });
  return fullSql;
}
