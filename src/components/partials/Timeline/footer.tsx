interface TimelineStatusFooterProps {
  isEmpty: boolean;
  isEnd: boolean;
}

export const TimelineStatusFooter = ({
  isEmpty,
  isEnd,
}: TimelineStatusFooterProps) => {
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <p className="text-sm text-bpim-muted">
          アクティビティが見つかりませんでした。
        </p>
        <p className="text-xs text-bpim-subtle">
          フィルター条件を変えてみてください
        </p>
      </div>
    );
  }

  if (isEnd) {
    return (
      <div className="flex items-center justify-center border-t border-bpim-border py-8">
        <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-text/20">
          End of Activities
        </span>
      </div>
    );
  }

  return null;
};
