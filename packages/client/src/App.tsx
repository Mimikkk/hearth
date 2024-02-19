import { ThemeProvider } from '@logic/Theme/useTheme.js';
import { Footer } from '@modules/interface/Footer/Footer.js';

const Layout = () => {
  return (
    <main class="flex flex-col gap-1 pb-0.5 w-screen h-screen">
      <div class="grid grid-cols-6 h-full rounded-sm divide-x">
        <div class="col-span-1 px-1 py-2">Lista przykładów</div>
        <div class="col-span-5 px-1 py-2">Center</div>
      </div>
      <Footer class="col-span-full px-1" />
    </main>
  );
};

export const App = () => (
  <ThemeProvider key="dark-mode">
    <Layout />
  </ThemeProvider>
);
