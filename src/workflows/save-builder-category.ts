import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk"
import { ModuleRegistrationName } from "@medusajs/utils";
import '../modules/implementations';

type SaveInBuilderInput = {
    categoryId: string;
};

const saveInBuilderStep = createStep("Save category in builder", async (input: SaveInBuilderInput, context) => {
    const builderModuleService = context.container.resolve('builderModuleService');
    const productService = context.container.resolve(ModuleRegistrationName.PRODUCT);
    const category = await productService.retrieveProductCategory(input.categoryId, {
        relations: ['metadata'],
    });
    const response = await builderModuleService.onCategoryCreated(category);
    return new StepResponse(response);
});

type SetBuilderIdOnCategoryInput = {
    categoryId: string;
    builderId: string;
};

type WorkflowInput = {
    categoryId: string;
};

const setBuilderIdOnCategoryStep = createStep("Set builder id on category", async (input: SetBuilderIdOnCategoryInput, context) => {
    const { categoryId, builderId } = input;
    const productService = context.container.resolve(ModuleRegistrationName.PRODUCT);
    const category = await productService.retrieveProductCategory(categoryId);
    category.metadata ??= {};
    category.metadata.builder_id = builderId;
    await productService.updateProductCategories(categoryId, {
        metadata: category.metadata,
    })
    return new StepResponse();
});

export const saveCategoryInBuilderWorkflow = createWorkflow("Save category in builder", (input: WorkflowInput) => {
    const { categoryId } = input;
    const saveResponse = saveInBuilderStep({ categoryId });
    const builderId = saveResponse.id;
    setBuilderIdOnCategoryStep({
        categoryId,
        builderId,
    });

    return new WorkflowResponse({
        builderId,
        categoryId,
    });
});
