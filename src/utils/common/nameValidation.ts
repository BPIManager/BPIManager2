/**
 * ユーザー名の形式チェック
 * @param name ユーザー名
 * @returns { isValid: boolean, message: string | null }
 */
export const validateUserName = (name: string) => {
  if (name.length < 2 || name.length > 20) {
    return {
      isValid: false,
      message: "ユーザー名は2文字以上20文字以内で入力してください",
    };
  }
  const forbiddenChars = /[/\\?#%*:*"'<>|]/;
  if (forbiddenChars.test(name)) {
    return {
      isValid: false,
      message: "使用できない記号（/ や \\ など）が含まれています",
    };
  }

  const allowedPattern =
    /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s._-]+$/;
  if (!allowedPattern.test(name)) {
    return {
      isValid: false,
      message: "名前に使用できない特殊な文字が含まれています",
    };
  }

  return { isValid: true, message: null };
};
