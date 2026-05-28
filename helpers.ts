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
      .map((n) => n.textContent?.trim())
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

export const transformEvolutions = async (evolutions: number[]) => {
  if (!evolutions.length) return { index: 0 };

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

  return evolutionChain;
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

  const formattedForm = form ? "-" + form.replaceAll(" ", "_") : "";

  const fileName = `${index}-${name.toLowerCase()}${formattedForm}`;

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

  console.log("args:", args);

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
