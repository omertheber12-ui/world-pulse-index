import Link from 'next/link';

const TABS = [
  ['/', 'Today'],
  ['/events', 'Events'],
  ['/connections', 'Connections'],
  ['/portfolio', 'Portfolio'],
];

export function TopBar() {
  return (
    <header className="conn-top">
      <div className="conn-wrap conn-topin">
        <Link className="conn-brand" href="/">World Pulse Index</Link>
        <nav className="conn-tabs" aria-label="Sections">
          {TABS.map(([href, label]) => (
            <Link key={href} className={href === '/connections' ? 'conn-tab on' : 'conn-tab'} href={href} aria-current={href === '/connections' ? 'page' : undefined}>
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
    <footer className="conn-foot">
      <div className="conn-wrap">
        <p>Insights only, not advice. · <Link href="/how">How it works</Link></p>
      </div>
    </footer>
  );
}
