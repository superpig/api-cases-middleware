# api-cases-middleware
a middleware which customes api case for swagger-jsblade

## install

```bash
npm install api-cases-middleware -S
```

or

```bash
yarn add api-cases-middleware -S
```

## usage

```js
const express = require('express');
const apiCasesMiddleware = require('api-cases-middleware');

const app = express();
app.use(apiCasesMiddleware('./casesConfig.js'));
```