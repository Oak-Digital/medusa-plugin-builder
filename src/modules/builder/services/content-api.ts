import { Zodios } from '@zodios/core';
import { BuilderModuleOptions, builderModuleOptionsSchema } from "../config";
import { z } from 'zod';
import { BuilderModuleContainer } from '../container';
import { Effect } from 'effect';
import { AxiosError } from 'axios';
import { UnknownException } from 'effect/Cause';
import { HttpError } from '../../../lib/errors/http';
import { NetworkError } from '../../../lib/errors/network';
import { transformZodiosError } from '../../../lib/errors/transform-zodios';

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
        const client = this.getClient();
        const result = Effect.tryPromise({
            async try(signal) {
                return client.retrieveModel({
                    params: {
                        modelName,
                    },
                    queries: {
                        query,
                    },
                });
            },
            catch: transformZodiosError,
        });

        return result;
    }
}

export default BuilderContentApiService;
