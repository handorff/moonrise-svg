import { grid } from "../generators/grid";
import { mountGeneratorUI } from "../ui";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  mountGeneratorUI(app, grid);
}
