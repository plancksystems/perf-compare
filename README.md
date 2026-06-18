# pizzahub performance benchmark

Two implementations of the same products and categories service, built
so you can compare Planck against a conventional Node stack on identical
routes and identical data.

| App                                      | Runtime                                         | Storage       | Default port |
| ---------------------------------------- | ----------------------------------------------- | ------------- | ------------ |
| [`planck-pizzahub`](./planck-pizzahub)   | Planck (single-binary DB + WASM host), HDA mono | Planck stores | 3020         |
| [`express-pizzahub`](./express-pizzahub) | Node.js + Express                               | MongoDB       | 4000         |

Both serve the same listing surface and share the exact same seed
dataset: **17 categories and 201 products** (the `seed/*.json` files are
byte-for-byte identical between the two apps). The Planck app is trimmed
to the read paths that matter for the benchmark.

| Method | Path          | Returns                                          | planck-pizzahub | express-pizzahub |
| ------ | ------------- | ------------------------------------------------ | --------------- | ---------------- |
| GET    | `/products`   | HTML list fragment (`?category=`, `?q=` filters) | yes             | yes              |
| GET    | `/categories` | HTML category list fragment                      | yes             | yes              |

For an apples-to-apples comparison, drive `/products` and `/categories`
on both apps with the same load tool (`wrk`, `oha`, or `autocannon`) and
keep the dataset identical.

---

## Prerequisites

### For `express-pizzahub`

- **Node.js 18 LTS or newer.** (Mongoose 8 requires at least Node
  16.20.1; 18 or 20 LTS is recommended.) Check with `node --version`.
- **MongoDB Community Edition 6.0 or newer**, running locally and
  reachable at `mongodb://127.0.0.1:27017` (the default in
  `express-pizzahub/config.yaml`). The app uses the `pizzahub` database.
  - macOS (Homebrew): `brew tap mongodb/brew && brew install mongodb-community`,
    then `brew services start mongodb-community`.
  - Other platforms: follow the MongoDB Community Edition install guide
    for your OS, then start `mongod`.
  - Confirm it is up: `mongosh --eval 'db.runCommand({ ping: 1 })'`.

### For `planck-pizzahub`

- `systemdb` and `workbench` running, with a `planctl` profile named
  `dev` pointing at your workbench. This is the same setup the
  [samples use](../samples/README.md#prerequisites); see that section
  for a ready-to-paste `~/.planctl/config.yaml`.
- The Zig toolchain on your `PATH` (`planctl deploy` builds the app
  before uploading it).

---

## Running `express-pizzahub`

```bash
cd express-pizzahub

# 1. Install dependencies
npm install

# 2. Make sure MongoDB is running (see prerequisites), then load the data.
npm run seed

# 3. Start the server
npm start
```

The app listens on `http://127.0.0.1:4000`. Try:

```bash
curl http://127.0.0.1:4000/healthz
curl http://127.0.0.1:4000/products
curl http://127.0.0.1:4000/categories
```

**Data lives in MongoDB.** Seeding writes to the `pizzahub` database,
collections `categories` and `products`. Mongoose creates the indexes
declared on the models automatically on first connect: `ProductID`
(unique), `Name`, and `CategoryID` on products, and `CategoryID`
(unique) on categories. To reset, just re-run `npm run seed`.

All configuration is in [`express-pizzahub/config.yaml`](./express-pizzahub/config.yaml)
(server port, Mongo URI, database name). There are no environment-variable
overrides; edit the YAML.

---

## Running `planck-pizzahub`

This is a Planck HDA monolith. You deploy it through `planctl`, then
create its stores and indexes and import the same seed data. The service
slug is `planck-pizzahub_db` (a mono app, so the service is always `db`).
Run the commands from the project root so `planctl` resolves the app
name from `app.yaml`.

```bash
cd planck-pizzahub

planctl deploy --all --arch mono --profile dev
```

### Create the stores

```bash
planctl create store categories --profile dev
planctl create store products    --profile dev
```

### Create the indexes

These mirror the indexes the Express/Mongoose models declare, so both
apps answer the same queries off comparable indexes.

```bash
planctl create index products.ProductID  --type i64    --profile dev
planctl create index products.CategoryID  --type i64    --profile dev
planctl create index products.Name         --type string --profile dev
planctl create index categories.CategoryID --type i64    --profile dev
```

### Import the seed data

The import is server-side: `planctl` sends the manifest, and the
workbench reads the JSON files named in it from the manifest's
`output_dir` on the workbench host. Adjust `output_dir` in each manifest
if your workbench reads the app from a different location.

```bash
cd app/seed
planctl import --manifest import.categories.yaml --profile dev
planctl import --manifest import.products.yaml   --profile dev
```

The app serves on the HTTP port from
[`app/service.yaml`](./planck-pizzahub/app/service.yaml) (`wasm.http.port`,
`3020` by default):

```bash
curl http://127.0.0.1:3020/products
curl http://127.0.0.1:3020/categories
```

---

## Compare performance

With both apps running and seeded, point the same load at each and
compare. These use [`oha`](https://github.com/hatoo/oha) (`brew install oha`),
running a 6 second burst against the `/categories` route on each app:

```bash
# planck-pizzahub
oha -z 6s http://127.0.0.1:3020/categories

# express-pizzahub
oha -z 6s http://127.0.0.1:4000/categories
```

Compare the requests/sec and latency percentiles `oha` prints for each.
Swap in `/products` (with `?category=` or `?q=`) to compare the filtered
paths. Keep the dataset identical between runs so the comparison stays
fair.

---

## The shared dataset

| File              | Records       |
| ----------------- | ------------- |
| `categories.json` | 17 categories |
| `products.json`   | 201 products  |

`express-pizzahub/seed/` and `planck-pizzahub/app/seed/` hold identical
copies. Each product carries `ProductID`, `SKU`, `Name`, `Description`,
`CategoryID`, `BasePrice`, `ImageURL`, and `Attributes`; each category
carries `CategoryID`, `Name`, and `Description`. Keeping the two copies
in sync is what makes the benchmark fair, so if you change one, change
the other.
