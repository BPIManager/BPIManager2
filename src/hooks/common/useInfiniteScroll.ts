import { useEffect, useRef } from "react";

interface UseInfiniteScrollProps {
  onIntersect: () => void;
  isLoading: boolean;
  isReachingEnd: boolean;
}

export const useInfiniteScroll = ({
  onIntersect,
  isLoading,
  isReachingEnd,
}: UseInfiniteScrollProps) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target || isReachingEnd || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [onIntersect, isLoading, isReachingEnd]);

  return observerTarget;
};
