// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSingleOpen } from "@/hooks/common/useSingleOpen";

const pointerDown = (pointerType: string, target: Element = document.body) => {
  const e = new Event("pointerdown", { bubbles: true });
  Object.defineProperty(e, "pointerType", { value: pointerType });
  target.dispatchEvent(e);
};

describe("useSingleOpen", () => {
  it("マウスはRadixの開閉通知で1つだけ開く", () => {
    const { result } = renderHook(() => useSingleOpen());
    act(() => {
      pointerDown("mouse");
      result.current.getProps("a").onOpenChange(true);
    });
    act(() => result.current.getProps("b").onOpenChange(true));
    expect(result.current.openKey).toBe("b");
    act(() => result.current.getProps("a").onOpenChange(false));
    expect(result.current.openKey).toBe("b");
  });

  it("タッチはタップで開き、Radixの閉じる通知では閉じず、再タップで閉じる", () => {
    const { result } = renderHook(() => useSingleOpen());
    act(() => {
      pointerDown("touch");
      result.current.getProps("a").onTap();
    });
    expect(result.current.openKey).toBe("a");
    act(() => result.current.getProps("a").onOpenChange(false));
    expect(result.current.openKey).toBe("a");
    act(() => result.current.getProps("a").onTap());
    expect(result.current.openKey).toBeNull();
  });

  it("タッチで開いたあと、トリガー・内容以外のタップで閉じる。内容内のタップでは閉じない", () => {
    const { result } = renderHook(() => useSingleOpen());
    const content = document.createElement("div");
    content.setAttribute("data-radix-popper-content-wrapper", "");
    const button = document.createElement("button");
    content.appendChild(button);
    document.body.appendChild(content);
    act(() => {
      pointerDown("touch");
      result.current.getProps("a").onTap();
    });
    act(() => pointerDown("touch", button));
    expect(result.current.openKey).toBe("a");
    act(() => pointerDown("touch", document.body));
    expect(result.current.openKey).toBeNull();
    content.remove();
  });
});
