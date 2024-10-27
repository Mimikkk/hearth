import { App } from "./App.tsx";
import { render } from "solid-js/web";

const root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);

render(App, root);
