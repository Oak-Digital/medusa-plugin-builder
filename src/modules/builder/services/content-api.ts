import { Zodios } from '@zodios/core';
import { BuilderModuleOptions, builderModuleOptionsSchema } from "../config";
import { z } from 'zod';
import { BuilderModuleContainer } from '../container';

const BUILDER_CONTENT_API_BASE = 'https://builder.io/api/v4/content';

export class BuilderContentApiService {
    protected readonly options_: BuilderModuleOptions;

    constructor(container: BuilderModuleContainer, options?: BuilderModuleOptions) {
        const parsedOptions = builderModuleOptionsSchema.parse(options);
        this.options_ = parsedOptions;
        // this.__container__
    }

    private getApiKey(): string {
        return this.options_.apiKey;
    }

    private createClient() {
        const apiKey = this.getApiKey();
        return new Zodios(BUILDER_CONTENT_API_BASE, [
            {
                method: 'get',
                path: '/:modelName',
                alias: 'retrieveModel',
                description: 'Retrieves the given model with a given query',
                response: z.object({
                    name: z.string(),
                    id: z.string(),
                    data: z.object({}).passthrough()
                }),
                parameters: [
                    {
                        name: 'query',
                        type: 'Query',
                        schema: z.object({}).passthrough(),
                    },
                ],
            },
        ], {
            axiosConfig: {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            },
        });
    }

    private getClient() {
        return this.createClient();
    }

    public retrieveModel(modelName: string, query: { [key: string]: unknown }) {
        return this.getClient().retrieveModel({
            params: {
                modelName,
            },
            queries: {
                query,
            },
        });
    }
}

export default BuilderContentApiService;
