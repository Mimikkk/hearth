import { render } from "solid-js/web";
import { App } from "./app/App.tsx";
import "./styles.css";

const root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);

render(App, root);
