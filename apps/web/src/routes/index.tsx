import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <h1>Welcome to Exparo Demo</h1>
      <p>
        This is a demo application for Exparo library. It allows you to test
        your experiments in your application. This is a simple application that
        shows you how the library works. All the examples have backgroundUpdates
        enabled
      </p>
      Choose an experiment to watch:
      <div style={{ marginTop: "20px" }}>
        <Link to="/feature-flag-hook">Feature flag hook</Link> <br />
        <Link to="/feature-flag-component">Feature flag component</Link> <br />
        <Link to="/abn-test-hook">A/B/N testing hook</Link> <br />
        <Link to="/abn-test-component">A/B/N testing component</Link>
      </div>
    </div>
  );
}
