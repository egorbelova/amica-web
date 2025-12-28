type Paths<T> = T extends string
  ? never
  : {
      [K in keyof T]: K extends string
        ? T[K] extends Record<string, unknown>
          ? `${K}.${Paths<T[K]>} | ${K}`
          : K
        : never;
    }[keyof T];

type Flatten<T> = T extends Record<string, unknown> ? Paths<T> : never;

export type LocaleKeys<T> = Flatten<T>[number];
