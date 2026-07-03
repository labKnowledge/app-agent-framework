import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { createViteLibConfig } from '../../../scripts/create-vite-lib-config.js';

export default createViteLibConfig(dirname(fileURLToPath(import.meta.url)));
