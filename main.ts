import { Pokemon } from "./types.ts";
import {
  deleteFiles,
  downloadArtwork,
  getArgs,
  getArtwork,
  getCategory,
  getEvolutions,
  getForm,
  getGender,
  getGeneration,
  getIndex,
  getName,
  getNextIndex,
  getTypes,
  getVersions,
  savePokemonData,
  transformEvolutions,
} from "./helpers.ts";
import { getLocators } from "./locators.ts";
import { setupBrowser } from "./browser.ts";

const { endIndex, cleanFiles, headless } = getArgs();

if (cleanFiles) await deleteFiles();

const { page, wait, close } = await setupBrowser(headless);

// startup page
await page.goto("https://www.pokemon.com/us/pokedex/bulbasaur");
await wait();
await page.click("text=Accept All");

const {
  artworkLocator,
  categoryLocator,
  evolutionLocator,
  femaleLocator,
  formClickLocator,
  formLocator,
  genderlessLocator,
  indexLocator,
  maleLocator,
  nameLocator,
  nextIndexLocator,
  nextPokemonLocator,
  typeLocator,
  versionXButton,
  versionXLocator,
  versionYButton,
  versionYLocator,
} = getLocators(page);

let nextIndex = await getNextIndex(nextIndexLocator);

do {
  const formListItems = await formLocator.all();

  const formAmount = formListItems.length ? formListItems.length : 1;

  for (let form = 0; form < formAmount; form++) {
    if (formAmount !== 1) {
      await wait();
      await formClickLocator.click();

      await wait();
      await formListItems[form].click();
    }

    const name = await getName(nameLocator);
    const index = await getIndex(indexLocator);
    const gender = await getGender(
      genderlessLocator,
      maleLocator,
      femaleLocator,
    );
    const category = await getCategory(categoryLocator);
    const versions = await getVersions(
      wait,
      versionYButton,
      versionYLocator,
      versionXButton,
      versionXLocator,
    );
    const types = await getTypes(typeLocator);
    const formName = await getForm(name, formClickLocator);
    const evolutions = await getEvolutions(evolutionLocator);
    const finalEvolutions = await transformEvolutions(evolutions);
    const artworkSource = await getArtwork(artworkLocator);
    const artwork = await downloadArtwork(artworkSource, index, name, formName);
    const generation = getGeneration(index, formName);

    // console.log("New Pokemon");
    // console.log("------------------------------");
    // console.log("Name:", name);
    // console.log("Index:", index);
    // console.log("Gender:", gender);
    // console.log("Generation:", generation);
    // console.log("Category:", category);
    // console.log("Versions:", versions);
    // console.log("Types:", types);
    // console.log("Form:", formName);
    // console.log("Final evolutions:", finalEvolutions);
    // console.log("Artwork:", artwork);
    // console.log("------------------------------");

    const pokemon: Pokemon = {
      artwork,
      category,
      evolution_chain: finalEvolutions,
      flavor_text: versions,
      form: formName,
      gender,
      generation,
      index,
      name,
      type: types,
      home_sprite: null,
      home_sprite_female: null,
      home_sprite_female_shiny: null,
      home_sprite_shiny: null,
    };

    savePokemonData(pokemon);
  }

  nextIndex = await getNextIndex(nextIndexLocator);
  await nextPokemonLocator.click();
  await wait();
} while (nextIndex !== endIndex + 1);

await close();
