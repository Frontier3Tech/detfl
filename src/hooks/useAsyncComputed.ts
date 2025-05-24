import { useSignal, useSignalEffect } from '@preact/signals';

export enum AsyncComputedState {
  Initial = 0,
  Idle,
  Pending,
  Stale,
}

export type AsyncComputedStore<T> = {
  state: AsyncComputedState;
  result: T;
  error?: any;
};

export type AsyncComputed<T> = {
  value: T;
  state: AsyncComputedStore<T>['state'];
  error?: any;
  peek: () => AsyncComputedStore<T>;
  subscribe: (callback: (value: AsyncComputedStore<T>) => void) => () => void;
};

export function useAsyncComputed<T>(
  initial: T,
  callback: () => Promise<T>,
  allowStale = true,
): AsyncComputed<T> {
  const state = useSignal<AsyncComputedStore<T>>({
    state: AsyncComputedState.Initial,
    result: initial,
  });

  useSignalEffect(() => {
    let mounted = true;
    state.value = { ...state.peek(), state: AsyncComputedState.Pending };

    callback()
      .then((result) => {
        if (!mounted) return;
        state.value = {
          state: AsyncComputedState.Idle,
          result,
        };
      })
      .catch((error) => {
        if (!mounted) return;
        if (allowStale) {
          state.value = {
            ...state.peek(),
            state: AsyncComputedState.Stale,
            error,
          };
        } else {
          state.value = {
            state: AsyncComputedState.Idle,
            result: initial,
            error,
          };
        }
      });

    return () => {
      mounted = false;
    };
  });

  return {
    get value() {
      return state.value.result;
    },
    get state() {
      return state.value.state;
    },
    get error() {
      return state.value.error;
    },
    peek: () => state.peek(),
    subscribe: (callback) => state.subscribe(callback),
  };
}