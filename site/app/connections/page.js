import { buildListState, loadConnections, loadingState } from '../../lib/connections.js';
import { buildPageState, loadCorrelations } from '../../lib/correlations.js';
import { EarlierChecks } from '../components/ConnectionsView.js';
import { StrongestLinksScreen } from '../components/StrongestLinksView.js';

export const metadata = {
  title: 'Connections · World Pulse Index',
  robots: { index: false, follow: false },
};

export default async function ConnectionsPage({ searchParams }) {
  const sp = await searchParams;
  const filter = sp.asset === 'oil' || sp.asset === 'bitcoin' ? sp.asset : 'all';
  const earlier = sp.state === 'loading' ? loadingState(filter) : buildListState(loadConnections(), filter);
  return (
    <StrongestLinksScreen
      state={buildPageState(loadCorrelations())}
      earlier={<EarlierChecks state={earlier} />}
    />
  );
}
