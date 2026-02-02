import { moonrise } from "../generators/moonrise";
import { mountGeneratorUI } from "../ui";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  mountGeneratorUI(app, moonrise);
}
