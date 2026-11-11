import { buildPageState, loadCorrelations } from '../../lib/correlations.js';
import { StrongestLinksScreen } from '../components/StrongestLinksView.js';

export const metadata = {
  title: 'Strongest links · World Pulse Index',
  robots: { index: false, follow: false },
};

export default function StrongestLinksPage() {
  return <StrongestLinksScreen state={buildPageState(loadCorrelations())} />;
}
