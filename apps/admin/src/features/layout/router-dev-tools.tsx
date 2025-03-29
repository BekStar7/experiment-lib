import * as React from "react";

const LazyRouterDevtools = import.meta.env.PROD
  ? () => null
  : React.lazy(() =>
      import("@tanstack/router-devtools").then((res) => ({
        default: res.TanStackRouterDevtools,
      })),
    );

const RouterDevtools: React.FC = () => {
  return (
    <React.Suspense fallback={null}>
      <LazyRouterDevtools />
    </React.Suspense>
  );
};

export default RouterDevtools;
