import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SOURCE_URL = process.env.OPENAPI_SOURCE_URL ?? 'http://localhost:3000';
const SPEC_URL = new URL('/api-docs-json', SOURCE_URL);
const SPEC_PATH = join(process.cwd(), 'openapi.json');

function fail(message) {
  console.error(`openapi:sync failed — ${message}`);
  console.error(`Source: ${SPEC_URL}`);
  console.error('Set OPENAPI_SOURCE_URL to point at a running backend, or start it with `pnpm dev` in ../backend.');
  process.exit(1);
}

const response = await fetch(SPEC_URL).catch(error => fail(`could not reach the backend (${error.message})`));

if (!response.ok) {
  fail(`the backend answered ${response.status} ${response.statusText}`);
}

const spec = await response.json().catch(() => fail('the response was not valid JSON'));

if (!spec?.openapi || !spec?.paths) {
  fail('the response did not look like an OpenAPI document');
}

await writeFile(SPEC_PATH, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
console.log(`Wrote ${SPEC_PATH} from ${SPEC_URL}`);
