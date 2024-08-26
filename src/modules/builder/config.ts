import { ProductCategoryDTO, ProductDTO } from "@medusajs/types";
import { z } from "zod";

export const builderModuleOptionsSchema = z.object({
    apiKey: z.string(),
    models: z.any() as z.ZodType<Models>,
});

type ModelConfig<T, N extends string, F> = {
    modelName: N;
    fields: z.ZodType<F>;
    transform: (medusaModel: T) => F;
};

type Models = {
    product?: ModelConfig<ProductDTO, string, any>;
    category?: ModelConfig<ProductCategoryDTO, string, any>;
};

export type BuilderModuleOptions = z.infer<typeof builderModuleOptionsSchema>;
