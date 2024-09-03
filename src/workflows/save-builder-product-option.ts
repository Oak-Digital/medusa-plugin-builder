import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk"
import { ModuleRegistrationName } from "@medusajs/utils";
import '../modules/implementations';
import { METADATA_BUILDER_ID } from "../lib";
import { ProductOptionDTO, ProductOptionValueDTO } from "@medusajs/types";

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
        option,
        valuesWithId,
    });
});

const saveOptionValuesInBuilderStep = createStep("Save option values in builder", async (input: { option: ProductOptionDTO, valuesWithId: { builderId: string | null, value: ProductOptionValueDTO }[] }, context) => {
    const { option, valuesWithId } = input;
    const builderModuleService = context.container.resolve('builderModuleService');

    // only save the values that do not have a builder id
    const newValuesWithIds = await Promise.all(valuesWithId.map(async ({ builderId, value }) => {
        if (builderId) {
            return {
                builderId,
                value,
            };
        }

        const newBuilderId = await builderModuleService.saveProductOptionValue(option, value);

        return {
            builderId: newBuilderId,
            value,
        };
    }));

    return new StepResponse({
        option,
        valuesWithId: newValuesWithIds,
    });
});

const saveOptionValuesBuilderIdStep = createStep("Save builder id in product option values", async (input: { option: ProductOptionDTO, valuesWithId: { builderId: string, value: ProductOptionValueDTO }[] }, context) => {
    const { option, valuesWithId } = input;
    const productService = context.container.resolve(ModuleRegistrationName.PRODUCT);

    const newValues = await Promise.all(valuesWithId.map(({ builderId, value }) => {
        if (value.metadata?.[METADATA_BUILDER_ID] === builderId) {
            return value;
        }
        value.metadata = {
            ...value.metadata,
            [METADATA_BUILDER_ID]: builderId,
        };

        // TODO: wait for update
        // await productService.updateProductOptionValues(value.id, {
        //     metadata: value.metadata,
        // });
    }));

    return new StepResponse({
        productOptionValues: newValues,
    })
});
