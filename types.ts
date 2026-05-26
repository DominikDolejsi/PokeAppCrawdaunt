export type Pokemon = {
  name: string;
  index: number;
  category: string;
  form: string | null;
  gender: number;
  generation: number;
  type: PokemonType[];
  flavor_text: string[];
  artwork: string;
  home_sprite: string | null;
  home_sprite_shiny: string | null;
  home_sprite_female: string | null;
  home_sprite_female_shiny: string | null;
  evolution_chain: Evolution;
};

export type Evolution = {
  index: number;
  evolution?: Evolution[];
};

export const POKEMON_TYPE = {
  Fire: "Fire",
  Water: "Water",
  Grass: "Grass",
  Poison: "Poison",
  Normal: "Normal",
  Rock: "Rock",
  Ground: "Ground",
  Flying: "Flying",
  Psychic: "Psychic",
  Ghost: "Ghost",
  Fighting: "Fighting",
  Electric: "Electric",
  Fairy: "Fairy",
  Steel: "Steel",
  Dark: "Dark",
  Dragon: "Dragon",
  Ice: "Ice",
  Bug: "Bug",
} as const;

export type PokemonType = keyof typeof POKEMON_TYPE;

export type GenMapping = {
  [generation: number]: { min: number; max: number; forms?: string[] };
};

export const generationMapping: GenMapping = {
  1: { min: 1, max: 151 },
  2: { min: 152, max: 251 },
  3: { min: 252, max: 386 },
  4: { min: 387, max: 493 },
  5: { min: 494, max: 649 },
  6: { min: 650, max: 721 },
  7: { min: 722, max: 809, forms: ["alolan"] },
  8: { min: 810, max: 905, forms: ["galarian", "hisuan", "gigantamax"] },
  9: { min: 906, max: 1025, forms: ["paldean"] },
} as const;
