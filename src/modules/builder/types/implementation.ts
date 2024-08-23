import { BUILDER_MODULE } from '../';
import BuilderModuleService from '../service';

declare module '@medusajs/types' {
    interface ModuleImplementations {
        [BUILDER_MODULE]: BuilderModuleService,
    }
}
