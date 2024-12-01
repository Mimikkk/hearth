import { Content } from "./Content/Content.tsx";
import { Devtools } from "./Devtools/DevTools.tsx";
import { Footer } from "./Footer/Footer.tsx";
import { LeftSidebar } from "./LeftSidebar/LeftSidebar.tsx";
import { RightSidebar } from "./RightSidebar/RightSidebar.tsx";

export const Layout = () => (
  <div class="grid grid-cols-12 relative">
    <LeftSidebar class="col-span-2 bg-primary-7 sticky top-0 h-screen overflow-y-auto" />
    <Content class="col-span-8 min-h-screen bg-primary-5" />
    <RightSidebar class="col-span-2 bg-primary-7 sticky top-0 h-screen overflow-y-auto" />
    <Footer class="fixed bottom-0 w-full bg-primary-8 text-white" />
    <Devtools />
  </div>
);
