import { Page } from "playwright";

export const getLocators = (page: Page) => {
  const nameLocator = page.locator(
    "div.pokedex-pokemon-pagination-title div",
  );
  const indexLocator = page.locator(
    "div.pokedex-pokemon-pagination-title span",
  );
  const nextPokemonLocator = page.locator("a.next");
  const nextIndexLocator = page.locator("a.next .pokemon-number");
  const evolutionLocator = page.locator(
    ".pokedex-pokemon-evolution .pokemon-number:visible",
  );
  const genderlessLocator = page.locator("span.attribute-value:visible", {
    hasText: "Unknown",
  });
  const maleLocator = page.locator("i.icon_male_symbol:visible");
  const femaleLocator = page.locator("i.icon_female_symbol:visible");
  const categoryLocator = page.locator(
    'li:has(span:has-text("Category")) span.attribute-value:visible',
  );
  const versionXLocator = page.locator("p.version-x:visible");
  const versionYLocator = page.locator("p.version-y:visible");
  const versionXButton = page.locator("span.version-x");
  const versionYButton = page.locator("span.version-y");
  const typeLocator = page.locator("div.dtm-type a:visible");
  const formClickLocator = page.locator("#formesSelect label");
  const formLocator = page.locator(".pokedex-pokemon-form li");
  const artworkLocator = page.locator(".profile-images img:visible");

  return {
    nameLocator,
    indexLocator,
    nextIndexLocator,
    nextPokemonLocator,
    evolutionLocator,
    genderlessLocator,
    maleLocator,
    femaleLocator,
    categoryLocator,
    versionXButton,
    versionXLocator,
    versionYButton,
    versionYLocator,
    formClickLocator,
    typeLocator,
    formLocator,
    artworkLocator,
  };
};
