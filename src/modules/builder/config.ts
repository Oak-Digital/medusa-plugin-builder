import { ProductDTO } from "@medusajs/types";
import { z } from "zod";

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
