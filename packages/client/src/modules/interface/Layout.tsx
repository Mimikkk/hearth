import { Footer } from '@modules/interface/Footer/Footer.js';
import { SideBar } from '@modules/interface/SideBar/SideBar.js';
import { Content } from '@modules/interface/Content/Content.js';
import { DevelopmentTools } from '@modules/development/DevelopmentTools.js';

export const Layout = () => (
  <main class="flex flex-col gap-1 pb-1 h-full overflow-auto">
    <div class="flex rounded-sm h-full overflow-auto">
      <SideBar class="rounded-br-sm" />
      <Content class="p-1" />
    </div>
    <Footer class="col-span-full px-2" />
    <DevelopmentTools />
  </main>
);
