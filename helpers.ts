import { Locator } from "playwright";
import {
  Evolution,
  generationMapping,
  Pokemon,
  POKEMON_TYPE,
  PokemonType,
} from "./types.ts";
import { parseArgs } from "@std/cli/parse-args";

export const isPokemonType = (value: string): value is PokemonType => {
  return Object.values(POKEMON_TYPE).includes(value as PokemonType);
};

export const getName = async (nameLocator: Locator): Promise<string> => {
  return await nameLocator.evaluate((element: HTMLElement) =>
    Array.from(element.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.replaceAll(/[♀♂]/g, "").trim())
      .join("")
  );
};

export const getIndex = async (indexLocator: Locator): Promise<number> => {
  return await indexLocator
    .allInnerTexts()
    .then((arr: string[]) => {
      if (arr.length > 0) {
        return Number(arr[0].slice(1));
      } else {
        throw new Error("Length of array with index is 0");
      }
    });
};

export const getNextIndex = async (nextIndexLocator: Locator) => {
  return Number((await nextIndexLocator.allInnerTexts())[0].slice(1));
};

export const getGender = async (
  genderlessLocator: Locator,
  maleLocator: Locator,
  femaleLocator: Locator,
): Promise<number> => {
  const genderless = await genderlessLocator.count();
  const male = await maleLocator.count();
  const female = await femaleLocator.count();

  // rule 0 - genderless 1 - male 2 - female 3 - gendered

  if (genderless) return 0;

  if (male && female) return 3;

  if (male) return 1;

  return 2;
};

export const getEvolutions = async (
  evolutionLocator: Locator,
): Promise<number[]> => {
  const evolutionNumbers = await evolutionLocator.allInnerTexts().then(
    (arr: string[]) => {
      if (arr.length > 0) {
        const newArr: number[] = [];
        for (const el of arr) {
          newArr.push(Number(el.slice(1)));
        }
        return newArr;
      } else {
        throw new Error("Length of array with index is 0");
      }
    },
  );

  return evolutionNumbers;
};

export const transformEvolutions = async (
  evolutions: number[],
  pokemonIndex: number,
) => {
  if (!evolutions.length) return null;

  const evolutionsSet = new Set(evolutions);

  type PokeAPISpecies = {
    evolves_from_species: { url: string } | null;
  };

  const evolutionChain: Evolution = { index: 0 };

  for (const index of evolutionsSet.values()) {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${index}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Fetch of ${url} responded with ${response.status}`);
    }

    const data: PokeAPISpecies = await response.json();

    if (data.evolves_from_species === null) {
      if (evolutionChain.evolution) {
        evolutionChain.evolution.push({
          index: evolutionChain.index,
          evolution: evolutionChain.evolution,
        });
      }

      evolutionChain.index = index;

      continue;
    }

    const preEvolutionIndex = Number(
      data.evolves_from_species.url.split("/").slice(-2, -1)[0],
    );
    const newEvolution = { index: index };

    if (
      evolutionChain.index === 0 || evolutionChain.index === preEvolutionIndex
    ) {
      evolutionChain.index = preEvolutionIndex;
      (evolutionChain.evolution ??= []).push(newEvolution);
    }

    if (evolutionChain.evolution) {
      evolutionChain.evolution.forEach((evo) => {
        if (evo.index === preEvolutionIndex) {
          (evo.evolution ??= []).push(newEvolution);
        }
      });
    }
  }

  const parseNextEvolution = (
    ownIndex: number,
    evoChain: Evolution,
  ): number[] | null => {
    if (!evoChain.evolution) return null;

    if (evoChain.index === ownIndex) {
      return evoChain.evolution.map((val) => val.index);
    }

    for (const secondEvo of evoChain.evolution) {
      if (secondEvo.index === ownIndex) {
        return secondEvo.evolution
          ? secondEvo.evolution.map((val) => val.index)
          : null;
      }
    }

    return null;
  };

  return parseNextEvolution(pokemonIndex, evolutionChain);
};

export const getCategory = async (
  categoryLocator: Locator,
): Promise<string> => {
  const category = await categoryLocator.allInnerTexts();

  if (category.length > 0) {
    return category[0].trim();
  } else {
    throw new Error("Length of array with category is 0");
  }
};

export const getVersions = async (
  wait: () => Promise<void>,
  versionYButton: Locator,
  versionYLocator: Locator,
  versionXButton: Locator,
  versionXLocator: Locator,
): Promise<string[]> => {
  await wait();
  await versionYButton.click();
  await wait();
  const versionY = (await versionYLocator.allInnerTexts())[0];

  await versionXButton.click();
  await wait();
  const versionX = (await versionXLocator.allInnerTexts())[0];

  const versions: string[] = [];

  if (versionX) versions.push(versionX);
  if (versionY && versionY !== versionX) versions.push(versionY);

  if (versions.length === 0) throw new Error("Did not found any versions");

  return versions;
};

export const getTypes = async (
  typeLocator: Locator,
): Promise<PokemonType[]> => {
  const types = await typeLocator.allInnerTexts();

  if (types.length < 1) {
    throw new Error(`Length of an array with types is ${types.length}`);
  }

  if (
    types.every((type: string) => isPokemonType(type))
  ) {
    return types as PokemonType[];
  }

  return [];
};

export const getForm = async (
  name: string,
  formClickLocator: Locator,
): Promise<string | null> => {
  const formName = await formClickLocator.allInnerTexts();

  const formattedFormName = formName[0]?.replace(name, "").replaceAll("(", "")
    .replaceAll(")", "")
    .replaceAll("  ", " ")
    .toLowerCase().trim();

  return formattedFormName ? formattedFormName : null;
};

export const getArtwork = async (artworkLocator: Locator) => {
  return await artworkLocator.getAttribute("src");
};

export const downloadArtwork = async (
  src: string | null,
  index: number,
  name: string,
  form: string | null,
) => {
  if (src === null) throw new Error(`Src for artwork download is ${src}`);

  const fileName = createArtworkFileName(index, name, form);

  const response = await fetch(src);

  if (!response.ok) {
    throw new Error(`Response to ${src} not ok ${response.status}`);
  }

  const imageData = new Uint8Array(await response.arrayBuffer());

  await Deno.mkdir("./images", { recursive: true });

  await Deno.writeFile(`./images/${fileName}.png`, imageData);

  return fileName;
};

export const savePokemonData = async (pokemon: Pokemon) => {
  let pokemonData = [];

  try {
    const pokemonTextData = await Deno.readTextFile("./pokemon.json");

    pokemonData = JSON.parse(pokemonTextData);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  pokemonData.push(pokemon);

  const updatedPokemonTextData = JSON.stringify(pokemonData);

  await Deno.writeTextFile("./pokemon.json", updatedPokemonTextData);
};

export const getGeneration = (index: number, form: string | null): number => {
  let generation = 0;

  Object.entries(generationMapping).forEach(
    ([gen, data]) => {
      if (
        data.forms?.some((el) => form?.includes(el)) ||
        (index >= data.min && index <= data.max)
      ) {
        generation = Number(gen);
      }
    },
  );

  return generation;
};

export const getArgs = () => {
  const args = parseArgs(Deno.args);
  const settings = {
    help: args.h ?? false,
    windowless: args.w ?? false,
    cleanFiles: args.n ?? false,
    endIndex: args.end ?? 0,
  };
  return settings;
};

export const deleteFiles = async () => {
  try {
    await Deno.remove("./images", { recursive: true });
    await Deno.remove("pokemon.json");
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }
};

const createArtworkFileName = (
  index: number,
  name: string,
  form: string | null,
) => {
  const formattedForm = form ? "-" + form.replaceAll(" ", "_") : "";
  return `${index}-${name.toLowerCase()}${formattedForm}`;
};

export const readPokemonData = async () => {
  // If cleanup is on then I woudl skip this fase
  // I read pokemon.json
  // if no pokemon.json than return undefined (send message to console)
  // If pokemon.json in wrong format return bulbasaur (send message to console)
  // than I do algo stuff - filter and variables
  // - I split pokemon data to unproblematic and without problematic last pokemon and write them down
  // - I get problematic part and extract image names and delete them in images folder
  // I  return latest pokemon name - which I use for starting url

  let latestPokemonName;

  try {
    const pokemonJSON = await Deno.readTextFile("./pokemon.json");

    const pokemonData: Pokemon[] = JSON.parse(pokemonJSON);

    const latestPokemon = pokemonData[pokemonData.length - 1];

    console.log("latestPokemon", latestPokemon);

    const latestPokemonData = pokemonData.filter((pokemon) =>
      pokemon.index === latestPokemon?.index
    );
    console.log("dataWithoutLatestPokemon", latestPokemonData);

    const imageNames: string[] = latestPokemonData.map((pokemon) =>
      createArtworkFileName(pokemon.index, pokemon.name, pokemon.form)
    );
    console.log("imageNames", imageNames);

    const dataWithoutLatestPokemon = pokemonData.filter((pokemon) =>
      pokemon.index !== latestPokemon?.index
    );
    console.log("solidPokemonData", dataWithoutLatestPokemon);

    await Deno.writeTextFile(
      "./pokemon.json",
      JSON.stringify(dataWithoutLatestPokemon),
    );

    imageNames.forEach((name) => {
      Deno.remove(`./images/${name}.png`);
    });

    latestPokemonName = latestPokemon?.name;

    console.log("latestPokemonName", latestPokemonName);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  return latestPokemonName?.toLowerCase();
};

const loadPokemonData = async () => {
  try {
    const pokemonJSON = await Deno.readTextFile("./pokemon.json");

    return JSON.parse(pokemonJSON);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
    if (err instanceof Deno.errors.NotFound) {
      console.log("pokemon.json not found > starting sequence from begining");
      return undefined;
    }
  }
};

const getLastPokemonEntries = (pokemonData: Pokemon[]) => {
  const lastPokemon = pokemonData[pokemonData.length - 1];

  const lastPokemonData = pokemonData.filter((pokemon) =>
    pokemon.index === lastPokemon?.index
  );

  const imageNames: string[] = lastPokemonData.map((pokemon) =>
    createArtworkFileName(pokemon.index, pokemon.name, pokemon.form)
  );

  return imageNames;
};

const deletePokemonImages = async (pokemonEntries: string[]) => {
  for (const name of pokemonEntries) {
    try {
      await Deno.remove(`./images/${name}.png`);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        console.log(
          `image name: ${name} was not found > images might not be cleaned up correctly`,
        );
      }
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err;
      }
    }
  }
};

const saveConsistentPokemonData = async (pokemonData: Pokemon[]) => {
  const lastPokemon = pokemonData[pokemonData.length - 1];
  const consistentPokemonData = pokemonData.filter((pokemon) =>
    pokemon.index !== lastPokemon?.index
  );

  await Deno.writeTextFile(
    "./pokemon.json",
    JSON.stringify(consistentPokemonData),
  );
};

const getRestartPokemon = (pokemonData: Pokemon[]) => {
  const lastPokemon = pokemonData[pokemonData.length - 1];

  return lastPokemon.name.toLowerCase();
};

export const recoverFromInterruptCrawl = async () => {
  const pokemonData = await loadPokemonData();

  if (pokemonData == undefined) return "bulbasaur";

  const lastPokemonEntries = getLastPokemonEntries(pokemonData);
  await deletePokemonImages(lastPokemonEntries);

  await saveConsistentPokemonData(pokemonData);

  const restartPokemon = getRestartPokemon(pokemonData);
  console.log(
    `Recover successfull -> starting from pokemon name: ${restartPokemon}`,
  );

  return restartPokemon;
};
