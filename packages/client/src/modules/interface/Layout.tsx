import { Footer } from '@modules/interface/Footer/Footer.js';
import { SideBar } from '@modules/interface/SideBar/SideBar.js';
import { Content } from '@modules/interface/Content/Content.js';

export const Layout = () => (
  <main class="flex flex-col gap-1 pb-1 w-screen h-screen">
    <div class="grid grid-cols-6 h-full rounded-sm divide-x">
      <SideBar />
      <Content class="col-span-5 px-1 py-2" />
    </div>
    <Footer class="col-span-full px-2" />
  </main>
);
