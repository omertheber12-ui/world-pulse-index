import { loadConnections } from '../../lib/connections.js';
import { loadHome } from '../../lib/linkScreen.js';
import { ConnectionsHome } from '../components/connections/ConnectionsHome.js';
import { ConnectionsLoading } from '../components/connections/ConnectionsLoading.js';
import { EarlierChecks } from '../components/ConnectionsView.js';
import { buildListState, loadingState } from '../../lib/connections.js';

export const metadata = {
  title: 'Connections · World Pulse Index',
  robots: { index: false, follow: false },
};

export default async function ConnectionsPage({ searchParams }) {
  const sp = await searchParams;
  if (sp.state === 'loading') return <ConnectionsLoading />;
  const filter = sp.asset === 'oil' || sp.asset === 'bitcoin' ? sp.asset : 'all';
  const earlier = buildListState(loadConnections(), filter);
  return <ConnectionsHome state={loadHome()} earlier={<EarlierChecks state={earlier} />} />;
}
