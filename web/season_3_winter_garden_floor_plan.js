const plan = document.querySelector("#floor-plan");
const ground = document.querySelector("#ground-level");
const gallery = document.querySelector("#gallery-level");
const title = document.querySelector("#layer-title");
const summary = document.querySelector("#layer-summary");
const buttons = [...document.querySelectorAll("[data-view]")];

const views = {
  ground: {
    title: "Ground floor",
    summary: "The main visitor route enters from the southeast, crosses the Palm Hall, and reaches the hotel connector without entering the west service wing. The service route connects the yard, delivery vestibule, potting room, and hall."
  },
  gallery: {
    title: "Upper gallery",
    summary: "A three-sided gallery overlooks the Palm Hall and opens onto a centered north-facing balcony above the Citrus Apse. Two stairs and a service lift provide access, while the northwest restoration bay remains connected to the service side."
  },
  overlay: {
    title: "Level comparison",
    summary: "The gallery sits above the Palm Hall perimeter and service roofs while leaving the central conservatory open. The north balcony aligns with the Citrus Apse below and projects toward the mountain view."
  }
};

function setView(view) {
  const next = views[view] ? view : "ground";
  const isOverlay = next === "overlay";
  ground.classList.toggle("is-visible", next === "ground" || isOverlay);
  gallery.classList.toggle("is-visible", next === "gallery" || isOverlay);
  plan.classList.toggle("is-overlay", isOverlay);
  title.textContent = views[next].title;
  summary.textContent = views[next].summary;

  for (const button of buttons) {
    const selected = button.dataset.view === next;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
}

for (const button of buttons) button.addEventListener("click", () => setView(button.dataset.view));

setView("ground");
