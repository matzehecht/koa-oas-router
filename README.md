# Welcome to koa-oas-router 👋
![Version](https://img.shields.io/npm/v/koa-oas-router.svg)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/maHecht/koa-oas-router#readme)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/maHecht/koa-oas-router/graphs/commit-activity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/maHecht/koa-oas-router/blob/master/LICENSE)

> This module extends the koa-router with some features usable with oas.

### 🏠 [Homepage](https://github.com/maHecht/koa-oas-router#readme)

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

const jsyaml = require('js-yaml');
const fs = require('fs');

const specFile = fs.readFileSync('./tmp/oas.yaml', 'utf8');
const spec = jsyaml.safeLoad(specFile);

const router = new KoaOasRouter.KoaOasRouter(opts);
router.addRoutesFromSpecification(spec);
```

#### Typescript
```typescript
import { KoaOasRouter } from 'koa-oas-router';

import * as jsyaml from 'js-yaml';
import * as fs from 'fs';

const specFile = fs.readFileSync('./tmp/oas.yaml', 'utf8');
const spec = jsyaml.safeLoad(specFile);

const router = new KoaOasRouter(opts);
router.addRoutesFromSpecification(spec);
```

For more detailed information look at the [API](docs/API.md).

## API

[API](docs/API.md)

## Run tests

```sh
npm run test
```

## Author

👤 **Matthias Hecht**

* Github: [@maHecht](https://github.com/maHecht)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/maHecht/koa-oas-router/issues).

## Show your support

Give a ⭐️ if this project helped you!


## 📝 License

Copyright © 2019 [Matthias Hecht](https://github.com/maHecht).

This project is [MIT](https://github.com/maHecht/koa-oas-router/blob/master/LICENSE) licensed.
