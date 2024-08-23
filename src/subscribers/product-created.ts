import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { saveProductInBuilderWorkflow } from "../workflows/save-builder-product";

// subscriber function
export default async function productCreateHandler({
    event,
    container,
}: SubscriberArgs<{ id: string }>) {
    const { result, errors } = await saveProductInBuilderWorkflow(container).run({
        input: {
            productId: event.data.id
        },
    });
    // console.log(result, errors);
}


// subscriber config
export const config: SubscriberConfig = {
    event: "product.created",
}
