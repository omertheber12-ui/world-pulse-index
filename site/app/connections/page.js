import { buildListState, loadConnections, loadingState } from '../../lib/connections.js';
import { ConnectionsScreen } from '../components/ConnectionsView.js';

export const metadata = { title: 'Connections · World Pulse Index' };

export default async function ConnectionsPage({ searchParams }) {
  const sp = await searchParams;
  const filter = sp.asset === 'oil' || sp.asset === 'bitcoin' ? sp.asset : 'all';
  if (sp.state === 'loading') return <ConnectionsScreen state={loadingState(filter)} />;
  return <ConnectionsScreen state={buildListState(loadConnections(), filter)} />;
}
