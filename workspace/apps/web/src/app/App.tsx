import type { JSXElement } from "solid-js";
import { createSignal } from "solid-js";

export const Sidebar = () => {
  return <div class="bg-gray-200 p-4">Sidebar</div>;
};

export const Content = () => {
  return <div class="bg-gray-100 p-4">Content</div>;
};

export const Footer = () => {
  return <div class="bg-gray-200 p-4">Footer</div>;
};

export const ResizerLine = () => {
  return <div class="bg-gray-300 h-2 w-full" />;
};

interface ResizableTwoSplitBoxProps {
  first: JSXElement;
  second: JSXElement;
}

export const ResizableTwoSplitBox = (props: ResizableTwoSplitBoxProps) => {
  const [isResizing, setIsResizing] = createSignal(false);

  return (
    <div class="flex flex-col">
      {props.first}
      <ResizerLine />
      {props.second}
    </div>
  );
};

export const App = () => (
  <div class="flex flex-col gap-2">
    <ResizableTwoSplitBox first={<Sidebar />} second={<Content />} />
    <Footer />
  </div>
);
