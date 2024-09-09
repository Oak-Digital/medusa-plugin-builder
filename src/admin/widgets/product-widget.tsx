import React from 'react';
import { Link } from 'react-router-dom';
import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { AdminProduct, DetailWidgetProps } from '@medusajs/types';
import { Container, Button } from '@medusajs/ui';

export const ProductWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
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
    zone: 'product.details.side.after',
})

export default ProductWidget;
