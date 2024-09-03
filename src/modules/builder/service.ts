import { z } from "zod";
import { BuilderModuleContainer } from "./container";
import {
    MedusaService,
} from '@medusajs/utils';
import { ProductCategoryDTO, ProductDTO, ProductOptionDTO, ProductOptionValueDTO } from "@medusajs/types";
import BuilderWriteApiService from "./services/write-api";
import { BuilderModuleOptions, builderModuleOptionsSchema } from "./config";
import BuilderContentApiService from "./services/content-api";
import { Effect } from "effect";
import { ConfigurationError } from "../../lib/errors/configuration";

export default class BuilderModuleService extends MedusaService({}) {
    protected readonly options_: BuilderModuleOptions;
    private readonly builderWriteApi: BuilderWriteApiService;
    private readonly builderContentApi: BuilderContentApiService;

    constructor(container: BuilderModuleContainer, options?: unknown) {
        super(...arguments);
        const parsedOptions = builderModuleOptionsSchema.parse(options);
        this.options_ = parsedOptions;
        // NOTE: we cannot use dependency injection, because medusa is not injecting options in other services.
        // this.builderWriteApi = container.builderWriteApiService;
        this.builderWriteApi = new BuilderWriteApiService(container, parsedOptions);
        this.builderContentApi = new BuilderContentApiService(container, parsedOptions);
    }

    private getProductConfig() {
        const initialProductConfig = this.options_.models.product;
        return initialProductConfig ?
            Effect.succeed(initialProductConfig) :
            Effect.fail(new ConfigurationError('Product config is not defined'));
    }

    public onProductCreated(product: ProductDTO) {
        return Effect.gen(this, function*() {
            const productConfig = yield* this.getProductConfig();
            const modelName = productConfig.modelName;
            const transformedProduct = yield* Effect.try({
                try() {
                    return productConfig.transform(product);
                },
                catch() {
                    return new ConfigurationError(`Error transforming product: ${JSON.stringify(product)}`);
                },
            });
            const response = yield* this.builderWriteApi.createModel(modelName, product.title, transformedProduct);
            return response;
        });
    }

    private getCategoryConfig() {
        const initialCategoryConfig = this.options_.models.category;
        return initialCategoryConfig ?
            Effect.succeed(initialCategoryConfig) :
            Effect.fail(new ConfigurationError('Category config is not defined'));
    }

    public onCategoryCreated(category: ProductCategoryDTO) {
        return Effect.gen(this, function*() {
            const categoryConfig = yield* this.getCategoryConfig();
            const transformedCategory = yield* Effect.try({
                try() {
                    return categoryConfig.transform(category);
                },
                catch() {
                    return new ConfigurationError(`Error transforming category: ${JSON.stringify(category)}`);
                },
            });
            const modelName = categoryConfig.modelName;
            const response = yield* this.builderWriteApi.createModel(modelName, category.name, transformedCategory);
            return response;

        });
    }

    /**
    * @returns the builder id of the option value if it exists
    */
    public checkProductOptionValueExists(option: ProductOptionDTO, value: ProductOptionValueDTO) {
        return Effect.gen(this, function*() {
            const productOptionWithValueConfig = yield* this.getProductOptionWithValueConfig();
            const retrieveObj = yield* Effect.try({
                try() {
                    return productOptionWithValueConfig.transformToRetrieve({
                        option,
                        value,
                    });
                },
                catch() {
                    return new ConfigurationError(`Error transforming product option value: ${JSON.stringify({ option, value })}`);
                },
            });

            const query: {
                [key: string]: {
                    $eq: string,
                };
            } = {};

            Object.entries(retrieveObj).forEach(([key, value]) => {
                query[key] = {
                    $eq: value,
                };
            });
            const response = yield* this.builderContentApi.retrieveModel(productOptionWithValueConfig.modelName, {
                data: query,
            });
            return response.id;
        });
    }

    private getProductOptionWithValueConfig() {
        return this.options_.models.productOptionWithValue ?
            Effect.succeed(this.options_.models.productOptionWithValue) :
            Effect.fail(new ConfigurationError('Product option with value config is not defined'));
    }

    public saveProductOptionValue(option: ProductOptionDTO, value: ProductOptionValueDTO) {
        return Effect.gen(this, function*() {
            const productOptionWithValueConfig = yield* this.getProductOptionWithValueConfig();
            const createObj = yield* Effect.try({
                try() {
                    return productOptionWithValueConfig.transform({
                        option,
                        value,
                    });
                },
                catch() {
                    return new ConfigurationError(`Error transforming product option value: ${JSON.stringify({ option, value })}`);
                },
            });

            const response = yield* this.builderWriteApi.createModel(productOptionWithValueConfig.modelName, value.value, createObj);
            return response.id;
        });
    }
}
