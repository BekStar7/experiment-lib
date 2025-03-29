import { renderHook, act } from "@testing-library/react";
import { useQuery } from "@/react/useQuery";

const createControlledPromise = <T = any>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe("useQuery", () => {
  test("should return loading state initially", async () => {
    const { promise, resolve } = createControlledPromise();
    const mockFetcher = jest.fn().mockReturnValue(promise);

    const { result } = renderHook(() => useQuery(mockFetcher));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    await act(async () => {
      resolve({ data: "test" });
    });
  });

  test("should return data and set loading to false on successful fetch", async () => {
    const { promise, resolve } = createControlledPromise();
    const mockData = { name: "test data" };
    const mockFetcher = jest.fn().mockReturnValue(promise);

    const { result } = renderHook(() => useQuery(mockFetcher));

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve(mockData);
    });

    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeUndefined();
  });

  test("should return error and set loading to false on failed fetch", async () => {
    const { promise, reject } = createControlledPromise();
    const mockError = new Error("Fetch failed");
    const mockFetcher = jest.fn().mockReturnValue(promise);

    const { result } = renderHook(() => useQuery(mockFetcher));

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      reject(mockError);
    });

    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(mockError);
  });

  test("should call onSuccess callback when fetch succeeds", async () => {
    const { promise, resolve } = createControlledPromise();
    const mockData = { name: "test data" };
    const mockFetcher = jest.fn().mockReturnValue(promise);
    const onSuccess = jest.fn();

    renderHook(() => useQuery(mockFetcher, [], { onSuccess }));

    await act(async () => {
      resolve(mockData);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(mockData);
  });

  test("should call onError callback when fetch fails", async () => {
    const { promise, reject } = createControlledPromise();
    const mockError = new Error("Fetch failed");
    const mockFetcher = jest.fn().mockReturnValue(promise);
    const onError = jest.fn();

    renderHook(() => useQuery(mockFetcher, [], { onError }));

    await act(async () => {
      reject(mockError);
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(mockError);
  });

  test("should refetch data when refetch is called", async () => {
    const firstPromise = createControlledPromise();
    const secondPromise = createControlledPromise();
    const mockData = { name: "test data" };
    const mockFetcher = jest
      .fn()
      .mockReturnValueOnce(firstPromise.promise)
      .mockReturnValueOnce(secondPromise.promise);

    const { result } = renderHook(() => useQuery(mockFetcher));

    await act(async () => {
      firstPromise.resolve(mockData);
    });

    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockData);

    await act(async () => {
      result.current.refetch();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      secondPromise.resolve({ name: "updated data" });
    });

    expect(mockFetcher).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual({ name: "updated data" });
    expect(result.current.isLoading).toBe(false);
  });

  test("should re-fetch when dependency array changes", async () => {
    const firstPromise = createControlledPromise();
    const secondPromise = createControlledPromise();

    const mockFetcher = jest
      .fn()
      .mockImplementationOnce((id) => {
        expect(id).toBe(1);
        return firstPromise.promise;
      })
      .mockImplementationOnce((id) => {
        expect(id).toBe(2);
        return secondPromise.promise;
      });

    const { result, rerender } = renderHook(
      ({ id }) => useQuery(() => mockFetcher(id), [id]),
      { initialProps: { id: 1 } },
    );

    await act(async () => {
      firstPromise.resolve({ id: 1, data: "first data" });
    });

    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ id: 1, data: "first data" });

    await act(async () => {
      rerender({ id: 2 });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      secondPromise.resolve({ id: 2, data: "second data" });
    });

    expect(mockFetcher).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual({ id: 2, data: "second data" });
  });

  test("should clean up and ignore stale requests", async () => {
    const slowPromise = createControlledPromise();
    const fastPromise = createControlledPromise();

    const mockFetcher = jest
      .fn()
      .mockReturnValueOnce(slowPromise.promise)
      .mockReturnValueOnce(fastPromise.promise);

    const { result, rerender } = renderHook(
      ({ dep }) => useQuery(mockFetcher, [dep]),
      { initialProps: { dep: 1 } },
    );

    await act(async () => {
      rerender({ dep: 2 });
    });

    await act(async () => {
      fastPromise.resolve({ id: 2, name: "fast" });
    });

    await act(async () => {
      slowPromise.resolve({ id: 1, name: "slow" });
    });

    expect(result.current.data).toEqual({ id: 2, name: "fast" });
    expect(mockFetcher).toHaveBeenCalledTimes(2);
  });
});
