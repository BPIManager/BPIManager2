// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDashboardLayoutEditor } from "@/hooks/dashboard/useDashboardLayoutEditor";
import {
  DashboardLayoutConfig,
  DEFAULT_LAYOUT_CONFIG,
} from "@/types/dashboard/layout";
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";

function buildConfig(): DashboardLayoutConfig {
  return {
    version: 2,
    mainCols: 2,
    widgets: [
      { id: "currentBpi", visible: true, section: "main", width: "half" },
      { id: "activity", visible: true, section: "main", width: "half" },
      { id: "radar", visible: true, section: "sidebar", width: "full" },
    ],
  };
}

function setup(config: DashboardLayoutConfig = buildConfig()) {
  const onClose = vi.fn();
  const onSave = vi.fn();
  const view = renderHook(() =>
    useDashboardLayoutEditor({ config, onClose, onSave }),
  );
  return { ...view, onClose, onSave, config };
}

describe("useDashboardLayoutEditor", () => {
  it("初期状態でdraftがconfigと一致し、main/sidebarに正しく振り分けられること", () => {
    const { result, config } = setup();

    expect(result.current.draft).toEqual(config);
    expect(result.current.mainWidgets.map((w) => w.id)).toEqual([
      "currentBpi",
      "activity",
    ]);
    expect(result.current.sidebarWidgets.map((w) => w.id)).toEqual(["radar"]);
    expect(result.current.activeId).toBeNull();
    expect(result.current.activeWidget).toBeNull();
  });

  it("toggleVisibleで対象ウィジェットのvisibleのみ反転すること", () => {
    const { result } = setup();

    act(() => result.current.toggleVisible("currentBpi"));

    const target = result.current.draft.widgets.find(
      (w) => w.id === "currentBpi",
    );
    const other = result.current.draft.widgets.find(
      (w) => w.id === "activity",
    );
    expect(target?.visible).toBe(false);
    expect(other?.visible).toBe(true);
  });

  it("toggleWidthでfull/halfが反転すること", () => {
    const { result } = setup();

    act(() => result.current.toggleWidth("currentBpi"));
    expect(
      result.current.draft.widgets.find((w) => w.id === "currentBpi")?.width,
    ).toBe("full");

    act(() => result.current.toggleWidth("currentBpi"));
    expect(
      result.current.draft.widgets.find((w) => w.id === "currentBpi")?.width,
    ).toBe("half");
  });

  it("setMainColsでmainColsが更新されること", () => {
    const { result } = setup();

    act(() => result.current.setMainCols(1));

    expect(result.current.draft.mainCols).toBe(1);
  });

  it("handleSaveでonSaveにdraftを渡しonCloseも呼ばれること", () => {
    const { result, onSave, onClose } = setup();

    act(() => result.current.toggleVisible("currentBpi"));
    const draftBeforeSave = result.current.draft;
    act(() => result.current.handleSave());

    expect(onSave).toHaveBeenCalledWith(draftBeforeSave);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("handleResetでdraftがDEFAULT_LAYOUT_CONFIGに戻ること", () => {
    const { result } = setup();

    act(() => result.current.handleReset());

    expect(result.current.draft).toEqual(DEFAULT_LAYOUT_CONFIG);
  });

  it("handleOpenChange(true)で変更中のdraftが元のconfigに巻き戻ること", () => {
    const { result, config } = setup();

    act(() => result.current.toggleVisible("currentBpi"));
    expect(result.current.draft).not.toEqual(config);

    act(() => result.current.handleOpenChange(true));

    expect(result.current.draft).toEqual(config);
  });

  it("handleOpenChange(false)でonCloseが呼ばれること", () => {
    const { result, onClose } = setup();

    act(() => result.current.handleOpenChange(false));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("handleDragStartでactiveId/dragOverSection/activeWidgetが設定されること", () => {
    const { result } = setup();

    act(() =>
      result.current.handleDragStart({
        active: { id: "radar" },
      } as unknown as DragStartEvent),
    );

    expect(result.current.activeId).toBe("radar");
    expect(result.current.dragOverSection).toBe("sidebar");
    expect(result.current.activeWidget?.id).toBe("radar");
  });

  it("handleDragOverでセクションコンテナ自体にoverした場合、そのセクションへ移動すること", () => {
    const { result } = setup();

    act(() =>
      result.current.handleDragOver({
        active: { id: "radar" },
        over: { id: "main" },
      } as unknown as DragOverEvent),
    );

    expect(result.current.dragOverSection).toBe("main");
    expect(
      result.current.draft.widgets.find((w) => w.id === "radar")?.section,
    ).toBe("main");
  });

  it("handleDragOverで別セクションのウィジェットにoverした場合、そのセクションへ移動すること", () => {
    const { result } = setup();

    act(() =>
      result.current.handleDragOver({
        active: { id: "radar" },
        over: { id: "currentBpi" },
      } as unknown as DragOverEvent),
    );

    expect(result.current.dragOverSection).toBe("main");
    expect(
      result.current.draft.widgets.find((w) => w.id === "radar")?.section,
    ).toBe("main");
  });

  it("handleDragOverでoverが無い場合はdragOverSectionをnullにし、draftは変更しないこと", () => {
    const { result } = setup();

    act(() =>
      result.current.handleDragOver({
        active: { id: "radar" },
        over: null,
      } as unknown as DragOverEvent),
    );

    expect(result.current.dragOverSection).toBeNull();
    expect(
      result.current.draft.widgets.find((w) => w.id === "radar")?.section,
    ).toBe("sidebar");
  });

  it("handleDragEndで同一セクション内の並び替えが行われること", () => {
    const { result } = setup();

    act(() =>
      result.current.handleDragEnd({
        active: { id: "currentBpi" },
        over: { id: "activity" },
      } as unknown as DragEndEvent),
    );

    expect(result.current.mainWidgets.map((w) => w.id)).toEqual([
      "activity",
      "currentBpi",
    ]);
    expect(result.current.activeId).toBeNull();
    expect(result.current.dragOverSection).toBeNull();
  });

  it("handleDragEndでoverが無い場合はactiveId/dragOverSectionをリセットするだけでdraftは変更しないこと", () => {
    const { result } = setup();

    act(() =>
      result.current.handleDragEnd({
        active: { id: "currentBpi" },
        over: null,
      } as unknown as DragEndEvent),
    );

    expect(result.current.activeId).toBeNull();
    expect(result.current.dragOverSection).toBeNull();
    expect(result.current.mainWidgets.map((w) => w.id)).toEqual([
      "currentBpi",
      "activity",
    ]);
  });
});
