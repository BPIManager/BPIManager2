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
        <p className="text-sm text-slate-500">
          アクティビティが見つかりませんでした。
        </p>
        <p className="text-xs text-slate-600">
          フィルター条件を変えてみてください
        </p>
      </div>
    );
  }

  if (isEnd) {
    return (
      <div className="flex items-center justify-center border-t border-white/5 py-8">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
          End of Activities
        </span>
      </div>
    );
  }

  return null;
};
