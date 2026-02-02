import { generators } from "../core/registry";

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  document.body.style.fontFamily = "system-ui";
  const cards = generators
    .map((generator) => {
      const description = generator.description
        ? `<p>${generator.description}</p>`
        : "";
      return `
        <article class="card">
          <h2>${generator.name}</h2>
          ${description}
          <a href="/${generator.id}/" class="card-link">Open ${generator.name}</a>
        </article>
      `;
    })
    .join("");

  app.innerHTML = `
    <main class="gallery">
      <header>
        <h1>Plotter SVG Gallery</h1>
        <p>Select a generator to explore its parameter controls and export tools.</p>
      </header>
      <section class="cards">
        ${cards}
      </section>
    </main>
  `;
}
