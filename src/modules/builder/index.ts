import { Module } from '@medusajs/utils';
import service from './service';

export const BUILDER_MODULE = "builderModuleService";

export default Module(BUILDER_MODULE, {
    service,
});

export * from './config';
export * from './types';
