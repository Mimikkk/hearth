import type { IconName } from '@components/buttons/Icon/Icon.js';
import type { AccordionItem } from '@components/control/Accordion/Accordion.js';

export namespace AccordionPath {
  export type WithPath = {
    icon?: IconName;
    title: string;
    id: string;
    children?: WithPath[];
    path: string;
  };

  export const read = (item: AccordionItem, path: string = ''): string => {
    if (!item.children) return path + '.' + item.id;

    return item.children.map(child => read(child, path + '.' + item.id)).join(' ');
  };

  export const within = (items: WithPath[], path?: string): boolean =>
    !path || items.some(({ children, path: id }) => path === id || (children && within(children, path)));

  export const assign = (items: AccordionItem[], path: string = ''): WithPath[] =>
    items.map(item => assignSingle(item, path));

  const assignSingle = (item: AccordionItem, path: string = ''): WithPath => ({
    children: item.children ? assign(item.children, path + '.' + item.id) : undefined,
    title: item.title,
    icon: item.icon,
    id: item.id,
    path: path + '.' + item.id,
  });
}
