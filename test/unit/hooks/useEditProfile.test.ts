// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { ctx, checkMock } = vi.hoisted(() => ({
  ctx: { value: {} as Record<string, unknown> },
  checkMock: vi.fn(),
}));

vi.mock("@/contexts/users/UserContext", () => ({
  useUser: () => ctx.value,
}));
vi.mock("@/services/swr/profile/editProfile", () => ({
  fetchStatsPrivacy: vi.fn().mockResolvedValue(null),
  checkUserNameAvailability: (...a: unknown[]) => checkMock(...a),
  saveProfile: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { useEditProfile } = await import("@/hooks/users/useEditProfile");

const existingUser = {
  userId: "u1",
  userName: "alice",
  iidxId: "1234-5678",
  profileText: "hi",
  isPublic: 1,
  xId: "",
  profileImage: "https://img/alice.png",
};

beforeEach(() => {
  checkMock.mockReset();
  ctx.value = { user: null, fbUser: null, refresh: vi.fn() };
});
afterEach(() => vi.useRealTimers());

describe("useEditProfile: 画像の初期値", () => {
  it("新規登録時は連携プロバイダのアイコン（_normal を除去）を初期値にする", () => {
    ctx.value = {
      user: null,
      fbUser: { uid: "f1", photoURL: "https://p/x_normal.jpg" },
      refresh: vi.fn(),
    };
    const { result } = renderHook(() => useEditProfile());
    expect(result.current.formData.profileImage).toBe("https://p/x.jpg");
  });

  it("アイコンが無ければ identicon を使う", () => {
    ctx.value = { user: null, fbUser: { uid: "f1", photoURL: null }, refresh: vi.fn() };
    const { result } = renderHook(() => useEditProfile());
    expect(result.current.formData.profileImage).toContain("identicon/svg?seed=f1");
  });

  it("入力済みの画像は初期値で上書きしない", () => {
    ctx.value = {
      user: null,
      fbUser: { uid: "f1", photoURL: "https://p/x.jpg" },
      refresh: vi.fn(),
    };
    const { result } = renderHook(() => useEditProfile());
    act(() => result.current.setFormData((p) => ({ ...p, profileImage: "https://mine" })));
    expect(result.current.formData.profileImage).toBe("https://mine");
  });

  it("登録済みユーザーは自分の画像で初期化される", () => {
    ctx.value = { user: existingUser, fbUser: { uid: "f1", photoURL: "https://p/x.jpg" }, refresh: vi.fn() };
    const { result } = renderHook(() => useEditProfile());
    expect(result.current.formData.profileImage).toBe("https://img/alice.png");
    expect(result.current.formData.userName).toBe("alice");
  });
});

describe("useEditProfile: ユーザー名の検証状態", () => {
  it("ユーザー名が空なら必須エラーで、重複チェックは呼ばない", () => {
    ctx.value = { user: null, fbUser: { uid: "f1" }, refresh: vi.fn() };
    const { result } = renderHook(() => useEditProfile());
    expect(result.current.nameStatus).toEqual({
      isChecking: false,
      error: "ユーザー名は必須です",
      available: false,
    });
    expect(checkMock).not.toHaveBeenCalled();
  });

  it("自分の現在のユーザー名は重複チェックせず利用可能として扱う", () => {
    vi.useFakeTimers();
    ctx.value = { user: existingUser, fbUser: { uid: "f1" }, refresh: vi.fn() };
    const { result } = renderHook(() => useEditProfile());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.nameStatus).toEqual({ isChecking: false, error: null, available: true });
    expect(checkMock).not.toHaveBeenCalled();
  });

  it("新しい名前は確認中を経て、デバウンス後に判定結果が反映される", async () => {
    vi.useFakeTimers();
    checkMock.mockResolvedValue({ available: false, message: "使用済みです" });
    ctx.value = { user: null, fbUser: { uid: "f1" }, refresh: vi.fn() };
    const { result } = renderHook(() => useEditProfile());
    act(() => result.current.setFormData((p) => ({ ...p, userName: "bob" })));
    expect(result.current.nameStatus.isChecking).toBe(true);
    expect(result.current.nameStatus.error).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(checkMock).toHaveBeenCalledTimes(1);
    expect(result.current.nameStatus).toEqual({
      isChecking: false,
      error: "使用済みです",
      available: false,
    });
  });

  it("名前を打ち直したら、前の名前の判定結果を引き継がず再び確認中になる", async () => {
    vi.useFakeTimers();
    checkMock.mockResolvedValue({ available: true });
    ctx.value = { user: null, fbUser: { uid: "f1" }, refresh: vi.fn() };
    const { result } = renderHook(() => useEditProfile());
    act(() => result.current.setFormData((p) => ({ ...p, userName: "bob" })));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.nameStatus.isChecking).toBe(false);
    act(() => result.current.setFormData((p) => ({ ...p, userName: "bobby" })));
    expect(result.current.nameStatus.isChecking).toBe(true);
  });
});
