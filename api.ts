import { Pokemon, PokemonDB } from "./types.ts";

export const api = async <T>(
  path: string,
  init: RequestInit,
): Promise<T> => {
  const response = await fetch(`${Deno.env.get("API")}${path}`, init);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${path}`);
  }

  return response.json() as Promise<T>;
};

export const getAllPokemon = (): Promise<PokemonDB[]> => {
  const getAllOptions: RequestInit = { method: "GET" };

  return api<PokemonDB[]>(
    "/pokemon?limit=0",
    getAllOptions,
  );
};

export const deletePokemon = (deleteIds: string[]) => {
  const deleteOptions: RequestInit = {
    method: "DELETE",
    body: JSON.stringify({ pokemonIds: deleteIds }),
  };

  api(
    "/pokemon",
    deleteOptions,
  );
};

export const cleanDatabase = async () => {
  const getAllData = await getAllPokemon();

  const deleteIds = getAllData.map((pokemon) => pokemon._id);
  console.log("deleteIds", deleteIds);

  if (deleteIds.length > 0) {
    deletePokemon(deleteIds);
  }
};

export const uploadPokemon = (pokemonData: Pokemon[]) => {
  const createOptions: RequestInit = {
    method: "POST",
    body: JSON.stringify(pokemonData),
  };

  api("pokemon", createOptions);
};
