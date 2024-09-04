import { createProductOptionsWorkflow, updateProductOptionsWorkflow } from '@medusajs/core-flows';
import { saveBuilderProductOptionWorkflow } from '../save-builder-product-option';

export const registerProductOptionsHooks = () => {
    createProductOptionsWorkflow.hooks.productOptionsCreated(({ product_options }, context) => {
        saveBuilderProductOptionWorkflow.runAsStep({
            input: {
                optionIds: product_options.map((option) => option.id),
            },
        });
    });

    updateProductOptionsWorkflow.hooks.productOptionsUpdated(({ product_options }, context) => {
        saveBuilderProductOptionWorkflow.runAsStep({
            input: {
                optionIds: product_options.map((option) => option.id),
            },
        });
    });
};
