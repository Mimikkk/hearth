export const Sidebar = () => {
  return <div class="bg-gray-200 p-4">Sidebar</div>;
};

export const Content = () => {
  return <div class="bg-gray-100 p-4">Content</div>;
};

export const Footer = () => {
  return <div class="bg-gray-200 p-4">Footer</div>;
};

export const App = () => (
  <div class="flex flex-col gap-2">
    <Sidebar />
    <Content />
    <Footer />
  </div>
);
