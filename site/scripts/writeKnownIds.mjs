import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConnections, pairId, selectVisiblePairs } from '../lib/connections.js';
import { linkId, loadCorrelations } from '../lib/correlations.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const correlations = loadCorrelations(path.join(root, 'data/correlations'));
const connections = loadConnections(path.join(root, 'data/connections'));
if (!correlations.file || !connections.file) throw new Error('connection id list needs both results files');
const ids = []
  .concat((correlations.file.pairs || []).map(linkId))
  .concat(selectVisiblePairs(connections.file.pairs).map(pairId));
writeFileSync(path.join(root, 'lib/knownConnectionIds.json'), JSON.stringify([...new Set(ids)].sort()));
