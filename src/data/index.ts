import destinations from './destinations.json'
import meta from './meta.json'
import rules from './rules.json'
import type { Dataset } from './schema'
import sources from './sources.json'

// The raw JSON assembled into one object.
export const rawDataset: unknown = { ...meta, sources, destinations, rules }

// The browser does not parse the dataset at runtime, so Zod stays out of the bundle.
// This cast is safe because src/data/dataset.test.ts checks, on every CI run, that
// DatasetSchema.parse(rawDataset) succeeds and returns exactly rawDataset.
export const dataset = rawDataset as Dataset
