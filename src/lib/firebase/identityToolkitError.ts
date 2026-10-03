/** Identity Toolkit REST が返したエラー。メールアドレス等の入力値は含めない。 */
export class IdentityToolkitError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(`Identity Toolkit request failed: ${code}`);
  }
}
