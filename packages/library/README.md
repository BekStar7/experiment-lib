# Getting Started

First you need to install the library:

## Installation

```bash
npm install exparo
```

## Setup

You need to wrap your application with the `ExparoProvider` component:

```tsx
import { ExparoProvider } from "exparo";

function App() {
  return (
    <ExparoProvider
      host="your-hosted-backend-url"
      apiKey="your-project-api-key"
    >
      <YourApp />
    </ExparoProvider>
  );
}
```

Also you can provide more configuration options:

```tsx
import { ExparoProvider } from "exparo";

function App() {
  return (
    <ExparoProvider
      host="your-hosted-backend-url"
      apiKey="your-project-api-key"
      storage={sessionStorage} // optional, default localStorage
      configs={{
        backgroundUpdate: false, // optional, default true
        webSocketPath: "/custom/path/", // optional, default /ws/experiments/
      }}
    >
      <YourApp />
    </ExparoProvider>
  );
}
```

- storage is used to store user data. You can use any storage that implements the `Storage` interface.
- backgroundUpdate is used to enable or disable websocket updates. By default it is enabled. If disabled, the library will take the data from storage and fetch in background once mounted to get the latest data.
- webSocketPath is used to configure the websocket path. By default it is `/ws/experiments/`.

# Usage

After you have setup the library you can use it in your application.

The library provides 2 types of experiments:

- Feature flag
- A/B/N testing

## Feature flag

Feature flag is a simple experiment that allows you to enable or disable a feature in your application.

### Usage

To use feature flag you need to create a feature flag experiment in the admin panel. Then you can use it in your application like this:

```tsx
import { useFeatureFlag } from "exparo";

function MyComponent() {
  const { isEnabled, isLoading, error, refresh, isRunning } = useFeatureFlag<{
    message: string;
  }>("my-feature-flag-experiment");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isRunning) {
    return <div>Experiment is not running</div>;
  }

  return (
    <div>
      {isEnabled ? "Enabled" : "Disabled"}
      {payload && <div>{payload.message}</div>}
    </div>
  );
}
```

Or can use `ExparoFeatureFlag` component:

```tsx
import { ExparoFeatureFlag } from "exparo";

function MyComponent() {
  return (
    <ExparoFeatureFlag experimentKey="my-feature-flag-experiment" fallback="Fallback">
      {(payload?: { message: string }) => (
        <div>
          {payload?.message}
        </div>
      )}
    </ExparoFeatureFlag>
  );
}
```

## A/B/N testing

A/B/N testing is a more complex experiment that allows you to test multiple variants of a feature.

### Usage

To use A/B/N testing you need to create an A/B/N testing experiment in the admin panel.

Then you can use it in your application like this:

```tsx
import { useGetVariant } from "exparo";

function MyComponent() {
  const { variant, isLoading, error, refresh, isRunning } = useGetVariant<{
    message: string;
  }>("my-ab-n-testing-experiment");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isRunning) {
    return <div>Experiment is not running</div>;
  }

  return (
    <div>
      {variant?.key === "A" ? "Variant A" : "Variant B"}
      {payload && <div>{payload.message}</div>}
    </div>
  );
}
```

Or can use `ExparoVariants` component:

```tsx
import { ExparoVariants, ExparoVariantRenderer } from "exparo";

function MyComponent() {
  return (
    <ExparoVariants experimentKey="my-ab-n-testing-experiment" fallback="Fallback">
      <ExparoVariantRenderer variantKey="A">
        Variant A
      </ExparoVariantRenderer>
      <ExparoVariantRenderer variantKey="B">
        {(payload?: { message: string }) => (
          <div>
            {payload?.message}
          </div>
        )}
      </ExparoVariantRenderer>
      <ExparoVariantRenderer variantKey="N">
        Variant N  
      </ExparoVariantRenderer>
    </ExparoVariants>
  );
}
```

# API

## useFeatureFlag

```ts
useFeatureFlag<T>(experimentKey: string, options?: HookOptions<T>): UseFeatureFlagReturnType<T>;
```

Use feature flag hook.

### Parameters

- `experimentKey` - experiment key
- `options` - optional options

### Options

- `refetchOnMount` - whether to refetch the experiment on mount. Default is `false`.
- `defaultVariant` - default variant to use if the experiment is not running. Default is `null`.

### Return value

- `payload` - variant payload
- `isLoading` - whether the experiment is loading
- `isFetching` - whether the experiment is fetching in the background
- `error` - error object
- `isA` - whether the variant is A
- `isB` - whether the variant is B
- `isControl` - whether the variant is control
- `isEnabled` - whether the variant is enabled
- `isDisabled` - whether the variant is disabled
- `isRunning` - whether the experiment is running
- `refresh` - function to refresh the experiment

## useGetVariant

```ts
useGetVariant<T>(experimentKey: string, options?: HookOptions<T>): UseGetVariantReturnType<T>;
```

Use get variant hook.

### Parameters

- `experimentKey` - experiment key
- `options` - optional options

### Options

- `refetchOnMount` - whether to refetch the experiment on mount. Default is `false`.
- `defaultVariant` - default variant to use if the experiment is not running. Default is `null`.

### Return value

- `variant` - variant object
- `experiment` - experiment object
- `payload` - variant payload
- `isLoading` - whether the experiment is loading
- `isFetching` - whether the experiment is fetching in the background
- `error` - error object
- `isA` - whether the variant is A
- `isB` - whether the variant is B
- `isControl` - whether the variant is control
- `isEnabled` - whether the variant is enabled
- `isDisabled` - whether the variant is disabled
- `isRunning` - whether the experiment is running
- `refresh` - function to refresh the experiment

## useExperimentClient

```ts
useExperimentClient(): ExperimentClient;
```

Use experiment client hook.

### Return value

- `storageManager` - storage manager
- `fetchVariant` - function to fetch a variant
- `subscribeToExperiment` - function to subscribe to an experiment
- `unsubscribeFromExperiment` - function to unsubscribe from an experiment
