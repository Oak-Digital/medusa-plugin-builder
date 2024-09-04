import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk"
import { ModuleRegistrationName } from "@medusajs/utils";
import '../modules/implementations';
import { Cause, Effect, Exit } from "effect";

type SaveInBuilderInput = {
    productId: string;
};

const saveInBuilderStep = createStep("Save product in builder", async (input: SaveInBuilderInput, context) => {
    const builderModuleService = context.container.resolve('builderModuleService');
    const productService = context.container.resolve(ModuleRegistrationName.PRODUCT);
    const product = await productService.retrieveProduct(input.productId, {
        relations: ['metadata'],
    });
    // const response = await builderModuleService.onProductCreated(product);
    const effect = builderModuleService.onProductCreated(product);
    // FIXME: we should not await here, but somehow we need to.
    const response = await Effect.runPromiseExit(await effect);


    if (Exit.isFailure(response)) {
        throw response.cause;
    }
    const responseValue = response.value;
    return new StepResponse(responseValue);
});

type SetBuilderIdOnProductInput = {
    productId: string;
    builderId: string;
};

type WorkflowInput = {
    productId: string;
};

const setBuilderIdOnProductStep = createStep("Set builder id on product", async (input: SetBuilderIdOnProductInput, context) => {
    const { productId, builderId } = input;
    const productService = context.container.resolve(ModuleRegistrationName.PRODUCT);
    const product = await productService.retrieveProduct(productId);
    product.metadata ??= {};
    product.metadata.builder_id = builderId;
    await productService.updateProducts(productId, {
        metadata: product.metadata,
    })
    return new StepResponse();
});

export const saveProductInBuilderWorkflow = createWorkflow("Save product in builder", (input: WorkflowInput) => {
    const { productId } = input;
    const saveResponse = saveInBuilderStep({ productId });
    const builderId = saveResponse.id;
    setBuilderIdOnProductStep({
        productId,
        builderId,
    });

    return new WorkflowResponse({
        builderId,
        productId,
    });
});
