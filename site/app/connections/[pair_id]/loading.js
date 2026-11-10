import { loadingState } from '../../../lib/connections.js';
import { ConnectionsScreen } from '../../components/ConnectionsView.js';

export default function Loading() {
  return <ConnectionsScreen state={loadingState('all')} />;
}
