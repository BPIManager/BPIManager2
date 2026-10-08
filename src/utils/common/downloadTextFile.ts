/**
 * 文字列をファイルとしてダウンロードさせる。CSVはExcelで文字化けしないよう、BOM付きUTF-8で渡す。
 *
 * @param filename - 保存時のファイル名
 * @param content - ファイルの中身
 * @param mimeType - MIMEタイプ（既定: CSV）
 */
export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = "text/csv;charset=utf-8;",
) {
  const blob = new Blob(["﻿" + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
