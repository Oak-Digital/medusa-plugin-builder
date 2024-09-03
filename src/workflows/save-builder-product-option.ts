import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk"
import { ModuleRegistrationName } from "@medusajs/utils";
import '../modules/implementations';
import { METADATA_BUILDER_ID } from "../lib";
import { ProductOptionDTO, ProductOptionValueDTO } from "@medusajs/types";
import { Effect, Exit } from "effect";

const optionExistsInBuilderStep = createStep("Check if option exists in builder", async (input: { optionId: string }, context) => {
    const builderModuleService = context.container.resolve('builderModuleService');
    const productService = context.container.resolve(ModuleRegistrationName.PRODUCT);

    const optionEffect = Effect.tryPromise(async () => {
        return productService.retrieveProductOption(input.optionId, {
            relations: ['values'],
        });
    });

    const stepEffect = Effect.gen(function*() {
        const option = yield* optionEffect;

        const valuesWithId = yield* Effect.all(option.values.map((value) => {
            if (METADATA_BUILDER_ID in (value.metadata ?? {})) {
                const builderId = value.metadata![METADATA_BUILDER_ID];
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

        return new StepResponse({
            option,
            valuesWithId,
        });
    });

    const response = await Effect.runPromiseExit(stepEffect);
    if (Exit.isFailure(response)) {
        throw response.cause;
    }

    return response.value;
});

const saveOptionValuesInBuilderStep = createStep("Save option values in builder", async (input: { option: ProductOptionDTO, valuesWithId: { builderId: string | null, value: ProductOptionValueDTO }[] }, context) => {
    const { option, valuesWithId } = input;
    const builderModuleService = context.container.resolve('builderModuleService');

    const stepEffect = Effect.gen(function*() {
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

        return new StepResponse({
            option,
            valuesWithId: newValuesWithIds,
        });
    });

    const stepResponseExit = await Effect.runPromiseExit(stepEffect);
    if (Exit.isFailure(stepResponseExit)) {
        throw stepResponseExit.cause;
    }

    return stepResponseExit.value;
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
