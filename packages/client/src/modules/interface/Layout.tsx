import { Footer } from '@modules/interface/Footer/Footer.js';
import { SideBar } from '@modules/interface/SideBar/SideBar.js';
import { Content } from '@modules/interface/Content/Content.js';
import { DevelopmentTools } from '@modules/development/DevelopmentTools.js';

export const Layout = () => (
  <main class="flex flex-col gap-1 pb-1 w-screen h-screen">
    <div class="flex h-full rounded-sm">
      <SideBar />
      <Content class="px-1 py-2" />
    </div>
    <Footer class="col-span-full px-2" />
    <DevelopmentTools />
  </main>
);
