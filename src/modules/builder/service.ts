import { z } from "zod";
import { BuilderModuleContainer } from "./container";
import {
    MedusaService,
} from '@medusajs/utils';
import { ProductDTO } from "@medusajs/types";
import BuilderWriteApiService from "./services/write-api";
import { BuilderModuleOptions, builderModuleOptionsSchema } from "./config";

export default class BuilderModuleService extends MedusaService({}) {
    protected readonly options_: BuilderModuleOptions;
    private readonly builderWriteApi: BuilderWriteApiService;

    constructor(container: BuilderModuleContainer, options?: unknown) {
        super(...arguments);
        const parsedOptions = builderModuleOptionsSchema.parse(options);
        this.options_ = parsedOptions;
        // NOTE: we cannot use dependency injection, because medusa is not injecting options in other services.
        // this.builderWriteApi = container.builderWriteApiService;
        this.builderWriteApi = new BuilderWriteApiService(container, parsedOptions);
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
}
