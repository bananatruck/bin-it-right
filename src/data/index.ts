import destinations from './destinations.json'
import meta from './meta.json'
import rules from './rules.json'
import { DatasetSchema, type Dataset } from './schema'
import sources from './sources.json'

// The raw JSON assembled into one object. Tests validate this against the snapshots.
export const rawDataset: unknown = { ...meta, sources, destinations, rules }

// Parsed once at load. A malformed dataset fails loudly instead of showing a wrong answer.
export const dataset: Dataset = DatasetSchema.parse(rawDataset)
