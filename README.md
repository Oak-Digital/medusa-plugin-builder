# Medusa "plugin" builder

**NOTE: Only for medusa v2/preview**

This repository consists of helpers and modules to synchronize products from medusa to [builder.io](https://builder.io).
Since medusa v2 does not support plugins yet, you will have to use the helpers.

## Installation

Install this package in your medusa project

```
npm install @oak-digital/medusa-plugin-builder zod
# or
yarn add @oak-digital/medusa-plugin-builder zod
# or
pnpm install @oak-digital/medusa-plugin-builder zod
```

## Usage

### Configure module

In `medusa-config.js` add the module

```js
// medusa-config.js

module.exports = defineConfig({
  modules: {
    // Your other modules ...
    builderModuleService: {
      resolve: '@oak-digital/medusa-plugin-builder/dist/modules/builder/index.js',
      /** @type {import('@oak-digital/medusa-plugin-builder').BuilderModuleOptions} */
      options: {
        apiKey: process.env.BUILDER_API_KEY,
        models: {
          // ...
        },
      },
    },
  },
});
```

#### `Models` option

For each model that you want synchronized, you should add the model for it in the `models` option. The purpose of this option is to get validate api responses and for you to transform a medusa product into the shape of your builder product.

```js
product: {
    modelName: 'product', // The model name in builder
    fields: z.object({
        // these are the fields that your builder product has
        medusaId: z.string().nullish(),
        name: z.string().nullish(),
        productDescription: z.string().nullish(),
    }),
    // This function should transform a medusa product to a builder product
    transform: (product) => ({
        medusaId: product.id,
        name: product.title,
        productDescription: product.description,
    }),
}
```

**NOTE: The validation uses zod, so be sure to import `z` from zod at the top of the file**


### Setting up subscribers

It is not enough to just configure the module as the module cannot create subscribers. Thus you must create each subscriber in your project.

```ts
// src/subscribers/product-to-builder.ts
export { default, config } from '@oak-digital/medusa-plugin-builder/dist/subscribers/product/index';
```

### Custom subscribers

If you do not want to use the provided subscribers, you can trigger the workflows yourself

TODO:

### Admin widgets

You should also set up each admin widget

TODO:
