import { z } from "zod";
import { BuilderModuleContainer } from "./container";
import {
    MedusaService,
    ContainerRegistrationKeys,
} from '@medusajs/utils';
import { ProductDTO } from "@medusajs/types";
import BuilderWriteApiService from "./services/write-api";

export const builderModuleOptionsSchema = z.object({
    apiKey: z.string(),
    models: z.any() as z.ZodType<Models<string, any>>,
});

type ModelConfig<T, N extends string, F> = {
    modelName: N;
    fields: z.ZodType<F>;
    transform: (medusaModel: T) => F;
};

type Models<PN extends string, PF> = {
    product?: ModelConfig<ProductDTO, PN, PF>;
};

export type BuilderModuleOptions = z.infer<typeof builderModuleOptionsSchema>;

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
