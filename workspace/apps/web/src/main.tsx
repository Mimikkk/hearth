import { render } from "solid-js/web";
import { App } from "./app/App.tsx";

const root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);

render(App, root);
