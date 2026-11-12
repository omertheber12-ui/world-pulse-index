import './connections.css';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function ConnectionsLayout({ children }) {
  return (
    <div className="cx-shell">
      {children}
    </div>
  );
}
