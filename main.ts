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
  recoverFromInterruptCrawl,
  savePokemonData,
  transformEvolutions,
} from "./helpers.ts";
import { getLocators } from "./locators.ts";
import { setupBrowser } from "./browser.ts";
import { cleanDatabase, uploadPokemon } from "./api.ts";

Deno.env.get("API");

const main = async () => {
  const { endIndex, cleanFiles, windowless, help, mode } = getArgs();
  // get arguments with which it was called
  // based on arguments call either crawl or upload
  //
  if (help) {
    console.log(`\nAvailable flags
  -w for hiding browser window
  -n for deleting already existing images and pokemon.json
  --end {number} for ending on specific pokemon (using national index)
  --mode {crawl, upload} for changng behavior\n
  `);
  }

  if (mode === "upload") {
    if (Deno.env.get("API") === undefined) {
      console.log("API env variable not defined, aborting the upload.");
      return;
    }

    console.log(`Starting uploading.
    `);

    try {
      const initialPokemonData = Deno.readTextFileSync("pokemon.json");
      const pokemonData: Pokemon[] = JSON.parse(initialPokemonData);

      if (pokemonData.length === 0) {
        throw new Error("Pokemon array lenght is zero");
      }

      const evolessPokemonData = pokemonData.map((pokemon) => {
        pokemon.next_evolution = null;
        return pokemon;
      });

      await cleanDatabase();
      await uploadPokemon(evolessPokemonData);
      // await updatePokemon(pokemonData)
    } catch (error) {
      console.log(`Got ${error} during update`);
    }

    // load data from pokemon.json
    // prepare evoless data
    //
    // Then proceede with upload sequence
    //
    // first load all the data
    // then delete all the data
    //
    // then upload evoless data
    // then go through the normal data and assign evolutions
    //
    // then profit ??
    //
    // check if data not null
    //
    //

    return;
  }

  console.log(`Starting crawling process.
  window: ${windowless ? "hidden" : "shown"}
  delete-files: ${cleanFiles ? "on" : "off"}
  ending index: ${endIndex ? endIndex : "last"}
  `);

  if (cleanFiles) await deleteFiles();

  const startingName = await recoverFromInterruptCrawl();

  const { page, wait, close } = await setupBrowser(windowless);

  await page.goto(`https://www.pokemon.com/us/pokedex/${startingName}`);
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
    await wait();

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
      const nextEvolution = await transformEvolutions(evolutions, index);
      const artworkSource = await getArtwork(artworkLocator);
      const artwork = await downloadArtwork(
        artworkSource,
        index,
        name,
        formName,
      );
      const generation = getGeneration(index, formName);

      const pokemon: Pokemon = {
        index,
        name,
        category,
        gender,
        generation,
        type: types,
        flavor_text: versions,
        next_evolution: nextEvolution,
        form: formName,
        artwork,
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

  console.log("Crawling ended successfully");

  await close();
};

await main();
