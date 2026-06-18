# express-pizzahub

Node / Express / MongoDB port of the Zig pizzahub `products` service
([../pizzahub/services/products](../pizzahub/services/products)).
Same routes, same HTML fragments, same JSON contract, different runtime.

## Routes

| Method | Path                  | Returns                                          |
| ------ | --------------------- | ------------------------------------------------ |
| GET    | `/products`           | HTML list fragment (`?category=`, `?q=` filters) |
| GET    | `/products/:id`       | HTML detail fragment                             |
| GET    | `/api/products/:id`   | JSON projection for service-to-service callers   |
| POST   | `/products`           | Create product (JSON body)                       |
| GET    | `/categories`         | HTML category-list fragment                      |
| POST   | `/categories`         | Create category (JSON body)                      |
| GET    | `/panel/home`         | Storefront landing fragment                      |
| GET    | `/healthz`            | `{ "ok": true }`                                 |

## Configuration

All configuration lives in [config.yaml](config.yaml). No environment-variable
overrides, edit the YAML.

## Run

```bash
npm install
npm run seed     # populates categories + products from seed/*.json
npm start
```

Requires a MongoDB instance reachable at the URI set in `config.yaml`
(default `mongodb://127.0.0.1:27017`, db `pizzahub`).
