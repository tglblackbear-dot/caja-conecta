import { CATEGORIES, LOCATIONS, filterListings, phoneDigits } from "./catalog.js";
import { initializeMerchantAuth } from "./merchant-auth.js";
import { loadListings } from "./services/listings.js";

const elements = {
  categoryGrid: document.querySelector("#category-grid"),
  clear: document.querySelector("#clear-filters"),
  dialog: document.querySelector("#listing-dialog"),
  dialogBusiness: document.querySelector("#dialog-business"),
  dialogCategory: document.querySelector("#dialog-category"),
  dialogDemo: document.querySelector(".dialog-demo"),
  dialogDescription: document.querySelector("#dialog-description"),
  dialogIcon: document.querySelector("#dialog-icon"),
  dialogLocation: document.querySelector("#dialog-location"),
  dialogTitle: document.querySelector("#dialog-title"),
  empty: document.querySelector("#empty-state"),
  error: document.querySelector("#error-state"),
  grid: document.querySelector("#listing-grid"),
  location: document.querySelector("#location-filter"),
  loading: document.querySelector("#loading-state"),
  query: document.querySelector("#search-input"),
  results: document.querySelector("#results-count"),
  whatsapp: document.querySelector("#dialog-whatsapp"),
  whatsappUnavailable: document.querySelector("#whatsapp-unavailable")
};

let listings = [];
let isDemo = true;
let activeCategory = "";

const CATEGORY_ICONS = new Map([
  ["Manutenção e Reformas", "🔧"],
  ["Gastronomia e Sabores Locais", "🍲"],
  ["Beleza e Estilo", "✨"],
  ["Automotivo", "🚗"],
  ["Fretes e Motoboy", "🛵"],
  ["Assistência Técnica", "💻"],
  ["Saúde e Bem-Estar", "🌿"],
  ["Eventos", "🎉"],
  ["Cultura e Educação", "📚"],
  ["Comércio e Utilidades", "🛍️"]
]);

const CATEGORY_DESCRIPTIONS = new Map([
  ["Manutenção e Reformas", "Reparos para sua casa"],
  ["Gastronomia e Sabores Locais", "Sabores feitos por aqui"],
  ["Beleza e Estilo", "Cuide de você"],
  ["Automotivo", "Carros, motos e muito mais"],
  ["Fretes e Motoboy", "Entregas e transporte"],
  ["Assistência Técnica", "Suporte para seus equipamentos"],
  ["Saúde e Bem-Estar", "Cuide da sua saúde"],
  ["Eventos", "O que acontece na região"],
  ["Cultura e Educação", "Aprenda e compartilhe"],
  ["Comércio e Utilidades", "Encontre o que precisa"]
]);

const CATEGORY_COLORS = [
  ["#2387f4", "#0755cc", "#85d9ff"],
  ["#ffb21c", "#e36b00", "#ffe29a"],
  ["#e85f9d", "#b22a72", "#ffc4dc"],
  ["#346ce9", "#1d3eb8", "#a9c8ff"],
  ["#ff7b13", "#de3e08", "#ffd08b"],
  ["#0fbd91", "#00896d", "#98f4d0"],
  ["#68cc27", "#38991a", "#c5f47e"],
  ["#a63bea", "#6822d1", "#e0b0ff"],
  ["#587af3", "#284bbd", "#bdceff"],
  ["#ee7a43", "#b84123", "#ffd1a2"]
];

function populateSelect(select, values) {
  const fragment = document.createDocumentFragment();
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    fragment.append(option);
  }
  select.append(fragment);
}

populateSelect(elements.location, LOCATIONS);

function updateCategoryButtons() {
  for (const button of elements.categoryGrid.querySelectorAll("button[data-category]")) {
    const selected = button.dataset.category === activeCategory;
    button.setAttribute("aria-pressed", String(selected));
  }
}

function renderCategoryButtons() {
  const fragment = document.createDocumentFragment();
  const options = [{ name: "Todas", value: "", icon: "✳", description: "Explore todos os serviços", colors: ["#39a96b", "#147843", "#b9e8a7"] }, ...CATEGORIES.map((name, index) => ({
    name,
    value: name,
    icon: CATEGORY_ICONS.get(name),
    description: CATEGORY_DESCRIPTIONS.get(name),
    colors: CATEGORY_COLORS[index]
  }))];

  for (const category of options) {
    const button = document.createElement("button");
    button.className = "category-button";
    button.type = "button";
    button.dataset.category = category.value;
    button.style.setProperty("--category-color", category.colors[0]);
    button.style.setProperty("--category-dark", category.colors[1]);
    button.style.setProperty("--category-light", category.colors[2]);
    button.setAttribute("aria-pressed", "false");
    const icon = document.createElement("span");
    icon.className = "category-button-icon";
    icon.textContent = category.icon;
    icon.setAttribute("aria-hidden", "true");
    const copy = document.createElement("span");
    copy.className = "category-button-copy";
    const label = document.createElement("span");
    label.className = "category-button-label";
    label.textContent = category.name;
    const description = document.createElement("span");
    description.className = "category-button-description";
    description.textContent = category.description;
    copy.append(label, description);
    const arrow = document.createElement("span");
    arrow.className = "category-button-arrow";
    arrow.textContent = "›";
    arrow.setAttribute("aria-hidden", "true");
    button.append(icon, copy, arrow);
    button.addEventListener("click", () => {
      activeCategory = category.value;
      updateCategoryButtons();
      renderListings();
    });
    fragment.append(button);
  }

  elements.categoryGrid.replaceChildren(fragment);
  updateCategoryButtons();
}

renderCategoryButtons();

function activeFilters() {
  return {
    query: elements.query.value,
    category: activeCategory,
    location: elements.location.value
  };
}

function makeTag(text, className) {
  const tag = document.createElement("span");
  tag.className = className;
  tag.textContent = text;
  return tag;
}

function makeCard(listing) {
  const card = document.createElement("article");
  card.className = "listing-card";
  const art = document.createElement("div");
  art.className = "card-art";
  art.style.backgroundColor = listing.color || "#e8f4eb";
  const icon = document.createElement("span");
  icon.textContent = listing.icon || "✳";
  icon.setAttribute("aria-hidden", "true");
  art.append(icon);
  const tags = document.createElement("div");
  tags.className = "card-top";
  tags.append(makeTag(listing.category, "category-tag"));
  if (isDemo) tags.append(makeTag("Fictício", "fiction-tag"));
  art.append(tags);

  const content = document.createElement("div");
  content.className = "card-content";
  const title = document.createElement("h4");
  title.textContent = listing.title;
  const business = document.createElement("p");
  business.className = "card-business";
  business.textContent = listing.businessName;
  const footer = document.createElement("div");
  footer.className = "card-footer";
  const location = document.createElement("span");
  location.className = "card-location";
  const pin = document.createElement("span");
  pin.textContent = "⌖";
  pin.setAttribute("aria-hidden", "true");
  location.append(pin, document.createTextNode(listing.neighborhood));
  const details = document.createElement("button");
  details.className = "details-button";
  details.type = "button";
  details.textContent = "Ver detalhes";
  details.setAttribute("aria-label", `Ver detalhes: ${listing.title}`);
  details.addEventListener("click", () => openDetails(listing));
  footer.append(location, details);
  content.append(title, business, footer);
  card.append(art, content);
  return card;
}

function renderListings() {
  const visible = filterListings(listings, activeFilters());
  const fragment = document.createDocumentFragment();
  visible.forEach((listing) => fragment.append(makeCard(listing)));
  elements.grid.replaceChildren(fragment);
  elements.grid.hidden = visible.length === 0;
  elements.empty.hidden = visible.length > 0;
  elements.error.hidden = true;
  elements.results.textContent = isDemo
    ? `${visible.length} ${visible.length === 1 ? "exemplo fictício" : "exemplos fictícios"}`
    : `${visible.length} ${visible.length === 1 ? "anúncio" : "anúncios"}`;
  const hasFilters = Object.values(activeFilters()).some((value) => value.trim());
  elements.clear.hidden = !hasFilters;
}

function openDetails(listing) {
  elements.dialogIcon.textContent = listing.icon || "✳";
  elements.dialogIcon.style.backgroundColor = listing.color || "#e8f4eb";
  elements.dialogCategory.textContent = listing.category;
  elements.dialogTitle.textContent = listing.title;
  elements.dialogBusiness.textContent = listing.businessName;
  elements.dialogDescription.textContent = listing.description;
  elements.dialogLocation.textContent = listing.neighborhood;
  elements.dialogDemo.hidden = !isDemo;
  const number = phoneDigits(listing.whatsapp);
  if (number && !isDemo) {
    elements.whatsapp.href = `https://wa.me/${number}`;
    elements.whatsapp.hidden = false;
    elements.whatsappUnavailable.hidden = true;
  } else {
    elements.whatsapp.removeAttribute("href");
    elements.whatsapp.hidden = true;
    elements.whatsappUnavailable.hidden = false;
  }
  if (typeof elements.dialog.showModal === "function") elements.dialog.showModal();
  else elements.dialog.setAttribute("open", "");
}

function clearFilters() {
  document.querySelector("#search-form").reset();
  activeCategory = "";
  updateCategoryButtons();
  renderListings();
  elements.query.focus();
}

async function initialize() {
  elements.grid.setAttribute("aria-busy", "true");
  elements.loading.hidden = false;
  elements.error.hidden = true;
  elements.empty.hidden = true;
  try {
    const result = await loadListings();
    listings = result.listings;
    isDemo = result.demo;
    document.querySelector(".demo-notice").hidden = !isDemo;
    document.querySelector(".demo-badge").hidden = !isDemo;
    renderListings();
  } catch (error) {
    console.error(error);
    document.querySelector(".demo-notice").hidden = true;
    document.querySelector(".demo-badge").hidden = true;
    elements.grid.replaceChildren();
    elements.grid.hidden = true;
    elements.error.hidden = false;
    elements.results.textContent = "Os anúncios não estão disponíveis.";
  } finally {
    elements.grid.setAttribute("aria-busy", "false");
    elements.loading.hidden = true;
  }
}

document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  renderListings();
});
elements.query.addEventListener("input", renderListings);
elements.location.addEventListener("change", renderListings);
elements.clear.addEventListener("click", clearFilters);
document.querySelector("#empty-clear").addEventListener("click", clearFilters);
document.querySelector("#retry-load").addEventListener("click", initialize);
document.querySelector("#dialog-close").addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});
initializeMerchantAuth();

initialize();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch((error) => console.error("Falha ao registrar o service worker:", error));
}
