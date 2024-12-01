import { Content } from "./Content/Content.tsx";
import { Devtools } from "./Devtools/DevTools.tsx";
import { Footer } from "./Footer/Footer.tsx";
import { Sidebar } from "./Sidebar/Sidebar.tsx";

export const Layout = () => (
  <div class="grid grid-cols-12 relative">
    <Sidebar class="col-span-2 bg-primary-7 sticky top-0 h-screen overflow-y-auto" />
    <Content class="col-span-8 min-h-screen bg-primary-5" />
    <Footer class="fixed bottom-0 w-full bg-primary-8 text-white" />
    <Devtools class="absolute right-0 bottom-0" />
  </div>
);
