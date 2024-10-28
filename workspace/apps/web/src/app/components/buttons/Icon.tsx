import cx from "clsx";
import type { IconProps as SolidIconProps } from "solid-icons";
import * as AiRegistry from "solid-icons/ai";
import * as BiRegistry from "solid-icons/bi";
import * as BsRegistry from "solid-icons/bs";
import * as CgRegistry from "solid-icons/cg";
import * as FaRegistry from "solid-icons/fa";
import * as FiRegistry from "solid-icons/fi";
import * as HiRegistry from "solid-icons/hi";
import * as ImRegistry from "solid-icons/im";
import * as IoRegistry from "solid-icons/io";
import * as OcRegistry from "solid-icons/oc";
import * as RiRegistry from "solid-icons/ri";
import * as SiRegistry from "solid-icons/si";
import * as TbRegistry from "solid-icons/tb";
import * as TiRegistry from "solid-icons/ti";
import * as VsRegistry from "solid-icons/vs";
import * as WiRegistry from "solid-icons/wi";
import { mergeProps, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import s from "./Icon.module.css";

export type IconName =
  | keyof typeof CgRegistry
  | keyof typeof BsRegistry
  | keyof typeof BiRegistry
  | keyof typeof AiRegistry
  | keyof typeof FiRegistry
  | keyof typeof FaRegistry
  | keyof typeof HiRegistry
  | keyof typeof ImRegistry
  | keyof typeof IoRegistry
  | keyof typeof OcRegistry
  | keyof typeof RiRegistry
  | keyof typeof SiRegistry
  | keyof typeof TbRegistry
  | keyof typeof TiRegistry
  | keyof typeof VsRegistry
  | keyof typeof WiRegistry;
export const IconRegistry = Object.assign(
  {},
  CgRegistry,
  BsRegistry,
  BiRegistry,
  AiRegistry,
  FiRegistry,
  FaRegistry,
  HiRegistry,
  ImRegistry,
  IoRegistry,
  OcRegistry,
  RiRegistry,
  SiRegistry,
  TbRegistry,
  TiRegistry,
  VsRegistry,
  WiRegistry,
);
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface IconProps extends SolidIconProps {
  name: IconName;
  size?: IconSize;
}

const keys = ["size", "class"] satisfies (keyof IconProps)[];
const initial = { size: "md" } satisfies Partial<IconProps>;
export const Icon = (props: IconProps) => {
  const [icon, $] = splitProps(mergeProps(initial, props), keys);

  return <Dynamic component={IconRegistry[props.name]} class={cx(s.icon, s[`size-${icon.size}`], icon.class)} {...$} />;
};
