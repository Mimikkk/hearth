export type UnPrefix<Value extends string, Fix extends string> = Value extends `${Fix}${infer Suffix}` ? Suffix : never;
export type UnPostfix<Value extends string, Fix extends string> = Value extends `${infer Prefix}${Fix}`
  ? Prefix
  : never;
