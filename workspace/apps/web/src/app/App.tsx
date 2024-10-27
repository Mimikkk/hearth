import cx from "clsx";
import { SplitPanel } from "./components/containers/SplitPanel/SplitPanel.tsx";

export const Sidebar = (props: { class?: string }) => {
  return <div class={cx("bg-gray-200 p-4", props.class)}>Sidebar</div>;
};

export const Content = (props: { class?: string }) => {
  return <div class={cx("bg-gray-100 p-4", props.class)}>Content</div>;
};

export const Footer = (props: { class?: string }) => {
  return <div class={cx("bg-gray-200 p-4", props.class)}>Footer</div>;
};

export const App = () => {
  return (
    <div class="flex flex-col gap-2">
      <SplitPanel
        first={<Sidebar class="min-w-12" />}
        second={<Content class="flex-grow" />}
        direction="horizontal"
      />
      <Footer />
    </div>
  );
};
