import { Zodios } from '@zodios/core';
import { BuilderModuleOptions, builderModuleOptionsSchema } from "../config";
import { z } from 'zod';
import { BuilderModuleContainer } from '../container';
import { Effect } from 'effect';
import { transformZodiosError } from '../../../lib/errors/transform-zodios';

const BUILDER_WRITE_API_BASE = 'https://builder.io/api/v1/write';

export class BuilderWriteApiService {
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
        return new Zodios(BUILDER_WRITE_API_BASE, [
            {
                method: 'post',
                path: '/:modelName',
                alias: 'createEntry',
                description: 'Creates an entry the given model',
                response: z.object({
                    name: z.string(),
                    id: z.string(),
                    data: z.object({}).passthrough()
                }),
                parameters: [
                    {
                        name: 'modelName',
                        type: 'Path',
                        description: 'The model\'s name',
                        schema: z.string(),
                    },
                    {
                        name: 'body',
                        type: 'Body',
                        schema: z.object({
                            name: z.string().optional(),
                            data: z.object({}).passthrough().optional(),
                        }),
                    }
                ],
                requestFormat: 'json',
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

    public createModel(modelName: string, name?: string, data?: { [key: string]: any }) {
        const client = this.getClient();

        const result = Effect.tryPromise({
            async try() {
                const result = await client.createEntry({
                    name,
                    data,
                }, {
                    params: {
                        modelName,
                    },
                });
                return result;
            },
            catch: transformZodiosError,
        });

        return result;
    }
}

export default BuilderWriteApiService;
