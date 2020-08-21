# Welcome to koa-oas-router 👋
[![Version](https://img.shields.io/npm/v/koa-oas-router.svg)](https://www.npmjs.com/package/koa-oas-router)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/matzehecht/koa-oas-router#readme)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/matzehecht/koa-oas-router/graphs/commit-activity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/matzehecht/koa-oas-router/blob/master/LICENSE)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

> This module extends the koa-router with some features usable with oas.

### 🏠 [Homepage](https://github.com/matzehecht/koa-oas-router)

## Features

- Extends the normal `koa-router`.
- Add routes on runtime from a oas-specification.
- Validates the oas (opt-out possible).
- Generates stubs for not implemented operations (opt-out possible).

## Install

```sh
npm i koa-oas-router --save
```

## Usage

#### Javascript
```js
const KoaOasRouter = require('koa-oas-router');

const yamljs = require('yamljs');

const spec = yamljs.load('./oas.yaml');

const router = new KoaOasRouter.KoaOasRouter(opts);
router.addRoutesFromSpecification(spec);
```

#### Typescript
```typescript
import { KoaOasRouter } from 'koa-oas-router';

import * as yamljs from 'yamljs';

const spec = yamljs.load('./oas.yaml');

const router = new KoaOasRouter(opts);
router.addRoutesFromSpecification(spec);
```

For more detailed information look at the [API](https://github.com/matzehecht/koa-oas-router/wiki/README).

## Docs

[API](https://github.com/matzehecht/koa-oas-router/wiki/README)

## Run tests

```sh
npm run test
```

## Author

👤 **Matthias Hecht**

* Github: [@matzehecht](https://github.com/matzehecht)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/matzehecht/koa-oas-router/issues).

## Show your support

Give a ⭐️ if this project helped you!


## 📝 License

Copyright © 2019 [Matthias Hecht](https://github.com/matzehecht).

This project is [MIT](https://github.com/matzehecht/koa-oas-router/blob/master/LICENSE) licensed.
