import { z } from "zod";
import { BuilderModuleContainer } from "./container";
import {
    MedusaService,
} from '@medusajs/utils';
import { ProductCategoryDTO, ProductDTO, ProductOptionDTO, ProductOptionValueDTO } from "@medusajs/types";
import BuilderWriteApiService from "./services/write-api";
import { BuilderModuleOptions, builderModuleOptionsSchema } from "./config";
import BuilderContentApiService from "./services/content-api";

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

    public async onProductCreated(product: ProductDTO) {
        const productConfig = this.options_.models.product;
        if (!productConfig) {
            return;
        }
        const modelName = productConfig.modelName;
        const response = await this.builderWriteApi.createModel(modelName, product.title, productConfig.transform(product));
        return response;
    }

    public async onCategoryCreated(category: ProductCategoryDTO) {
        const categoryConfig = this.options_.models.category;
        if (!categoryConfig) {
            return;
        }
        const modelName = categoryConfig.modelName;
        const response = await this.builderWriteApi.createModel(modelName, category.name, categoryConfig.transform(category));
        return response;
    }

    /**
    * @returns the builder id of the option value if it exists
    */
    public async checkProductOptionValueExists(option: ProductOptionDTO, value: ProductOptionValueDTO): Promise<string | null> {
        const productOptionWithValueConfig = this.options_.models.productOptionWithValue;
        if (!productOptionWithValueConfig) {
            // return;
            throw new Error('Product option with value config is not defined');
        }
        const retrieveObj = productOptionWithValueConfig.transformToRetrieve({
            option,
            value,
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

        try {
            const response = await this.builderContentApi.retrieveModel(productOptionWithValueConfig.modelName, {
                data: query,
            });

            return response.id;
        } catch (error) {
            // TODO: Handle network error
            console.error(error);
        }

        return null;
    }

    public async saveProductOptionValue(option: ProductOptionDTO, value: ProductOptionValueDTO) {
        const productOptionWithValueConfig = this.options_.models.productOptionWithValue;
        if (!productOptionWithValueConfig) {
            throw new Error('Product option with value config is not defined');
        }
        const createObj = productOptionWithValueConfig.transform({
            option,
            value,
        });

        try {
            const response = await this.builderWriteApi.createModel(productOptionWithValueConfig.modelName, value.value, createObj);
            return response.id;
        } catch (error) {
            throw error;
        }
    }
}
