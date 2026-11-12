import { notFound } from 'next/navigation';
import { buildDetailState, loadConnections, parsePairId } from '../../../lib/connections.js';
import { parseLinkId } from '../../../lib/correlations.js';
import { loadDetail } from '../../../lib/linkScreen.js';
import { ConnectionDetail } from '../../components/ConnectionsView.js';
import { ConnectionsLoading } from '../../components/connections/ConnectionsLoading.js';
import { LinkDetailView } from '../../components/connections/LinkDetailView.js';

export async function generateMetadata({ params }) {
  const { pair_id: id } = await params;
  if (parsePairId(id)) {
    const state = buildDetailState(loadConnections(), id);
    const title = state.mode === 'detail' ? state.title : 'Connection';
    return { title: title + ' · World Pulse Index', robots: { index: false, follow: false } };
  }
  const detail = parseLinkId(id) ? loadDetail(id) : null;
  const title = detail && detail.row ? detail.row.detail.pageHeadline : 'Connection';
  return { title: title + ' · World Pulse Index', robots: { index: false, follow: false } };
}

export default async function ConnectionPairPage({ params, searchParams }) {
  const { pair_id: id } = await params;
  const sp = await searchParams;
  if (parsePairId(id)) {
    const state = buildDetailState(loadConnections(), id);
    if (state.mode !== 'detail') notFound();
    if (sp.state === 'loading') return <ConnectionsLoading />;
    return <ConnectionDetail state={state} />;
  }
  const detail = loadDetail(id);
  if (!detail || detail.mode !== 'ready') notFound();
  if (sp.state === 'loading') return <ConnectionsLoading />;
  return <LinkDetailView state={detail} />;
}
