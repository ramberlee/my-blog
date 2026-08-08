import { useEffect, useRef, useCallback, useState } from "react";

interface UseInfiniteScrollOptions {
  /** Whether more data is available to load */
  hasMore: boolean;
  /** Whether a load is currently in flight */
  isLoading: boolean;
  /** Callback invoked when the sentinel enters the viewport */
  onLoadMore: () => void;
  /** Root margin passed to IntersectionObserver (default: "200px") */
  rootMargin?: string;
}

/**
 * Observes a sentinel element and fires `onLoadMore` when it becomes visible.
 *
 * @returns A ref callback to attach to the sentinel element,
 *          plus the current loading / hasMore state for convenience.
 */
export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = "200px",
}: UseInfiniteScrollOptions) {
  const observer = useRef<IntersectionObserver | null>(null);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);

  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    setSentinel(node);
  }, []);

  useEffect(() => {
    if (!sentinel) return;
    if (!hasMore) return;

    // Disconnect previous observer
    observer.current?.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          onLoadMore();
        }
      },
      { rootMargin }
    );

    observer.current.observe(sentinel);

    return () => {
      observer.current?.disconnect();
    };
  }, [sentinel, hasMore, isLoading, onLoadMore, rootMargin]);

  return { loadMoreRef, isLoading, hasMore };
}
