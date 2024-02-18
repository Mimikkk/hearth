export type Color =
  | 'rose'
  | 'pink'
  | 'fuchsia'
  | 'purple'
  | 'violet'
  | 'indigo'
  | 'blue'
  | 'sky'
  | 'cyan'
  | 'teal'
  | 'emerald'
  | 'green'
  | 'lime'
  | 'yellow'
  | 'amber'
  | 'orange'
  | 'red'
  | 'gray';

export type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type UnPrefix<Value extends string, Fix extends string> = Value extends `${Fix}${infer Suffix}` ? Suffix : never;
export type UnPostfix<Value extends string, Fix extends string> = Value extends `${infer Prefix}${Fix}`
  ? Prefix
  : never;
