import React from 'react';
import { Link } from 'react-router-dom';
import { defineWidgetConfig } from '@medusajs/admin-shared';
import { AdminProduct, AdminProductCategory, DetailWidgetProps } from '@medusajs/types';
import { Container, Button } from '@medusajs/ui';

export const ProductCategoryWidget = ({ data }: DetailWidgetProps<AdminProductCategory>) => {
    const builderId = data.metadata?.builder_id;
    // const builderId = data.metadata?.[METADATA_BUILDER_ID];
    const link = builderId ? `https://builder.io/content/${builderId}` : null;

    const text = "View in builder.io";
    return (
        <Container>
            <Button variant='primary' asChild={!!link} disabled={!link}>
                {link ? (
                    <Link to={link} target='_blank'>
                        {text}
                    </Link>
                ) : (
                    text
                )}
            </Button>
        </Container>
    );
};

export const config = defineWidgetConfig({
    zone: 'product_category.details.side.after',
})

export default ProductCategoryWidget;
