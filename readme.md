# Crawdaunt 🦞

Crawdaunt is a crawling tool used for a PokeApp (name in progress). It crawls
pokemon data and images mostly from official pokemon site with the help from
PokeAPI. It formats the data and spits out a json used for seeding and updating
of the database.

## Project Architecture

This repository is part of a larger Pokémon application split into several
repositories. The project follows a clear separation of responsibilities, where
each repository focuses on a single concern.

- [Frontend 💅](https://github.com/DominikDolejsi/PokeAppFrontend)
- [Backend ⚙️](https://github.com/DominikDolejsi/PokeAppBackend)
- **Crawdaunt** <- you are here
- [Images 🖼️](https://github.com/DominikDolejsi/PokeAppImages)

# Installation

```bash

git clone

cd crawdaunt

deno install

deno run configure

```

# Usage

```bash

deno run main.ts

```

# Tech Stack

- Deno
- Playwright
