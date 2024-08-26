import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { saveCategoryInBuilderWorkflow } from "../../workflows/save-builder-category";

const categoryCreatedHandler = async ({
    event,
    container,
}: SubscriberArgs<{ id: string }>) => {
    const { result, errors } = await saveCategoryInBuilderWorkflow(container).run({
        input: {
            categoryId: event.data.id
        },
    });
};

export const config: SubscriberConfig = {
    event: "productService.product-category.created",
};

export default categoryCreatedHandler;
