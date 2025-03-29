import React from "react";

type QueryState<T> = {
  data?: T;
  error?: Error;
  isLoading: boolean;
};

type QueryOptions<T> = {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
};

export const useQuery = <T>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
  options: QueryOptions<T> = {},
) => {
  const [state, setState] = React.useState<QueryState<T>>({ isLoading: true });
  const [refetchCount, setRefetchCount] = React.useState(0);

  const stableFetcher = React.useRef(fetcher);
  stableFetcher.current = fetcher;

  const stableOptions = React.useRef(options);
  stableOptions.current = options;

  React.useEffect(() => {
    let ignore = false;
    setState((prev) => ({ ...prev, isLoading: true }));

    stableFetcher
      .current()
      .then((data) => {
        if (!ignore) {
          setState({ data, isLoading: false });
          stableOptions.current.onSuccess?.(data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setState({ error, isLoading: false });
          stableOptions.current.onError?.(error);
        }
      });

    return () => {
      ignore = true;
    };
  }, [...deps, refetchCount]);

  const refetch = React.useCallback(() => {
    setRefetchCount((count) => count + 1);
  }, []);

  return { ...state, refetch };
};
