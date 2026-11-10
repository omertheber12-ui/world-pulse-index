import { buildDetailState, loadConnections, loadingState } from '../../../lib/connections.js';
import { ConnectionDetail, ConnectionsScreen } from '../../components/ConnectionsView.js';

export async function generateMetadata({ params }) {
  const { pair_id: pairId } = await params;
  const state = buildDetailState(loadConnections(), pairId);
  const title = state.mode === 'detail' ? state.title : 'Connection';
  return { title: title + ' · World Pulse Index' };
}

export default async function ConnectionPairPage({ params, searchParams }) {
  const { pair_id: pairId } = await params;
  const sp = await searchParams;
  if (sp.state === 'loading') return <ConnectionsScreen state={loadingState('all')} />;
  return <ConnectionDetail state={buildDetailState(loadConnections(), pairId)} />;
}
