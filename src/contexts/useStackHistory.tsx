import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

type StackHistory<T> = {
  stack: T[];
  current: T | undefined;
  push: (value: T) => void;
  replace: (value: T) => void;
  back: () => void;
  canGoBack: boolean;
  clear: () => void;
};

function useCreateStackHistory<T>(initial?: T): StackHistory<T> {
  const [stack, setStack] = useState<T[]>(() =>
    initial !== undefined ? [initial] : [],
  );

  const push = useCallback((value: T) => {
    setStack((prev) => [...prev, value]);
  }, []);

  const replace = useCallback((value: T) => {
    setStack((prev) => {
      if (prev.length === 0) return [value];
      return [...prev.slice(0, -1), value];
    });
  }, []);

  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const clear = useCallback(() => {
    setStack([]);
  }, []);

  const current = stack[stack.length - 1];
  const canGoBack = stack.length > 1;

  return {
    stack,
    current,
    push,
    replace,
    back,
    canGoBack,
    clear,
  };
}

export function createStackHistory<T>() {
  const Context = createContext<StackHistory<T> | null>(null);

  const Provider = ({
    initial,
    children,
  }: {
    initial?: T;
    children: ReactNode;
  }) => {
    const value = useCreateStackHistory<T>(initial);

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  const useStackHistory = () => {
    const ctx = useContext(Context);
    if (!ctx) {
      throw new Error('useStackHistory must be used inside its Provider');
    }
    return ctx;
  };

  return { Provider, useStackHistory };
}

export const { Provider: PageStackProvider, useStackHistory: usePageStack } =
  createStackHistory<string>();
