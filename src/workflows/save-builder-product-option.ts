import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk"
import { ModuleRegistrationName } from "@medusajs/utils";
import '../modules/implementations';
import { METADATA_BUILDER_ID } from "../lib";
import { ProductOptionDTO, ProductOptionValueDTO } from "@medusajs/types";
import { Effect, Exit } from "effect";

const optionExistsInBuilderStep = createStep("Check if option exists in builder", async (input: { optionIds: string[] }, context) => {
    const builderModuleService = context.container.resolve('builderModuleService');
    const productService = context.container.resolve(ModuleRegistrationName.PRODUCT);

    const optionsEffect = Effect.all(input.optionIds.map((optionId) => {
        return Effect.tryPromise(async () => {
            return productService.retrieveProductOption(optionId, {
                relations: ['values'],
            });
        });
    }));

    const stepEffect = Effect.gen(function*() {
        const options = yield* optionsEffect;

        const optionsWithValues = yield* Effect.all(options.map((option) => {
            const valuesWithId = Effect.all(option.values.map((value) => {
                if (METADATA_BUILDER_ID in (value.metadata ?? {}) && typeof value.metadata?.[METADATA_BUILDER_ID] === 'string') {
                    const builderId = value.metadata[METADATA_BUILDER_ID];
                    return Effect.succeed({
                        builderId,
                        value,
                    });
                }
                const builderId = builderModuleService.checkProductOptionValueExists(option, value);
                const valueWithId = Effect.map(builderId, (builderId) => ({
                    builderId,
                    value,
                }));

                return valueWithId;
            }));

            return Effect.map(valuesWithId, (valuesWithId) => ({
                option,
                valuesWithId,
            }));
        }));

        return optionsWithValues;
    });

    const response = await Effect.runPromiseExit(stepEffect);
    if (Exit.isFailure(response)) {
        throw response.cause;
    }

    return new StepResponse({
        optionsWithValues: response.value,
    });
});

const saveOptionValuesInBuilderStep = createStep("Save option values in builder", async (input: { option: ProductOptionDTO, valuesWithId: { builderId: string | null, value: ProductOptionValueDTO }[] }[], context) => {
    const builderModuleService = context.container.resolve('builderModuleService');

    const optionsHandledEffect = Effect.all(input.map(({ option, valuesWithId }) => {
        return Effect.gen(function*() {
            // only save the values that do not have a builder id
            const newValuesWithIds = yield* Effect.all(valuesWithId.map(({ builderId, value }) => {
                if (builderId) {
                    return Effect.succeed({
                        builderId,
                        value,
                    });
                }

                const newBuilderId = builderModuleService.saveProductOptionValue(option, value);

                return Effect.map(newBuilderId, (newBuilderId) => ({
                    builderId: newBuilderId,
                    value,
                }));
            }));

            return {
                option,
                valuesWithId: newValuesWithIds,
            };
        });
    }));

    const stepResponseExit = await Effect.runPromiseExit(optionsHandledEffect);
    if (Exit.isFailure(stepResponseExit)) {
        throw stepResponseExit.cause;
    }

    return new StepResponse(stepResponseExit.value);
});

const saveOptionValuesBuilderIdStep = createStep("Save builder id in product option values", async (input: { option: ProductOptionDTO, valuesWithId: { builderId: string, value: ProductOptionValueDTO }[] }[], context) => {
    const productService = context.container.resolve(ModuleRegistrationName.PRODUCT);

    const newOptionsWithValues = await Promise.all(input.map(({ option, valuesWithId }) => {
        const newValues = valuesWithId.map(({ builderId, value }) => {
            if (value.metadata?.[METADATA_BUILDER_ID] === builderId) {
                return value;
            }
            value.metadata = {
                ...value.metadata,
                [METADATA_BUILDER_ID]: builderId,
            };

            return productService.updateProductOptionValues(value.id, {
                metadata: value.metadata,
            });
            return value;
        });

        return {
            option,
            values: newValues,
        };
    }));

    return new StepResponse({
        productOptionsWithValues: newOptionsWithValues,
    });
});

type SaveBuilderProductOptionWorkflowInput = {
    optionIds: string[];
};

export const saveBuilderProductOptionWorkflow = createWorkflow("Save product option in builder", (input: SaveBuilderProductOptionWorkflowInput) => {
    const { optionIds } = input;
    const x = optionExistsInBuilderStep({
        optionIds,
    });

    const y = saveOptionValuesInBuilderStep(x.optionsWithValues);

    const z = saveOptionValuesBuilderIdStep(y);

    return new WorkflowResponse(z);
});
