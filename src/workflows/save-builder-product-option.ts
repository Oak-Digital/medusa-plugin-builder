import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk"
import { ModuleRegistrationName } from "@medusajs/utils";
import '../modules/implementations';
import { METADATA_BUILDER_ID } from "../lib";

const optionExistsInBuilderStep = createStep("Check if option exists in builder", async (input: { optionId: string }, context) => {
    const builderModuleService = context.container.resolve('builderModuleService');
    const productService = context.container.resolve(ModuleRegistrationName.PRODUCT);
    const option = await productService.retrieveProductOption(input.optionId, {
        relations: ['values'],
    });

    const valuesWithId = await Promise.all(option.values.map(async (value) => {
        if (METADATA_BUILDER_ID in (value.metadata ?? {})) {
            const builderId = value.metadata![METADATA_BUILDER_ID];
            return {
                builderId,
                value,
            }
        }
        const builderId = await builderModuleService.checkProductOptionValueExists(option, value);
        return {
            builderId,
            value,
        };
    }));

    return new StepResponse({
        valuesWithId,
    });
});
