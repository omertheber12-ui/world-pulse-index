import './connections.css';
import { TopBar } from '../components/connections/TopBar.js';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function ConnectionsLayout({ children }) {
  return (
    <div className="cx-shell">
      <TopBar />
      {children}
    </div>
  );
}
