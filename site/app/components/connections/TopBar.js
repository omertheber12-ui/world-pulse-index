import Link from 'next/link';

const TABS = [
  ['/', 'Today'],
  ['/events', 'Events'],
  ['/connections', 'Connections'],
  ['/portfolio', 'Portfolio'],
];

export function TopBar() {
  return (
    <header className="cx-top">
      <div className="cx-wrap cx-topin">
        <Link className="cx-brand" href="/">World Pulse Index</Link>
        <nav className="cx-tabs" aria-label="Sections">
          {TABS.map(([href, label]) => (
            <Link key={href} className={href === '/connections' ? 'cx-tab on' : 'cx-tab'} href={href} aria-current={href === '/connections' ? 'page' : undefined}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function ConnFooter() {
  return (
    <footer className="cx-foot">
      <div className="cx-wrap">
        <p>Insights only, not advice. · <Link href="/how">How it works</Link></p>
      </div>
    </footer>
  );
}
