import * as React from "react";

type UseMediaQueryOptions = {
  onChange?: (matches: boolean) => void;
};

export default function useMediaQuery(
  query: string,
  options?: UseMediaQueryOptions,
): boolean | undefined {
  const { onChange: _onChange } = options || {};
  const [isMatch, setIsMatch] = React.useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia && window.matchMedia(query).matches;
    }
    return;
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (!window.matchMedia) {
        return;
      }

      const matcher = window.matchMedia(query);

      const onChange = ({ matches }: { matches: boolean }) => {
        setIsMatch(matches);
        _onChange?.(matches);
      };

      matcher.addListener(onChange);

      return () => {
        matcher.removeListener(onChange);
      };
    }

    return;
  }, [isMatch, query, setIsMatch]);

  return isMatch;
}
