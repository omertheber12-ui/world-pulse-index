'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const TABS = [
  ['/', 'Today', '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>'],
  ['/events', 'Events', '<svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h9"/></svg>'],
  ['/connections', 'Connections', '<svg viewBox="0 0 24 24"><circle cx="7" cy="12" r="2.5"/><circle cx="17" cy="12" r="2.5"/><path d="M9.5 12h5"/></svg>'],
  ['/portfolio', 'Portfolio', '<svg viewBox="0 0 24 24"><path d="M12 4a8 8 0 1 0 8 8h-8z"/><path d="M14 2.5A8 8 0 0 1 21.5 10H14z"/></svg>'],
];

const memory = new Map();

function memGet(key) {
  return memory.has(key) ? String(memory.get(key)) : '';
}

function memSet(key, value) {
  memory.set(key, String(value));
}

function on(pathname, href) {
  if (href === '/') return pathname === '/' || pathname === '/week';
  if (href === '/events') return pathname === '/events' || pathname.startsWith('/event/');
  return pathname === href || pathname.startsWith(href + '/');
}

export function Header() {
  const pathname = usePathname() || '/';
  return (
    <header>
      <div className="bar">
        <Link className="brand" href="/">World Pulse Index</Link>
        <nav id="tabs">
          {TABS.map(([href, label, icon]) => (
            <Link key={href} className={on(pathname, href) ? 'tab on' : 'tab'} href={href} aria-current={on(pathname, href) ? 'page' : undefined}>
              <span className="ico" dangerouslySetInnerHTML={{ __html: icon }} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Transition({ children }) {
  const pathname = usePathname();
  const [cls, setCls] = useState('');
  useEffect(() => {
    const dir = memGet('wpi-dir');
    memory.delete('wpi-dir');
    setCls(dir === 'back' ? 'nav-back' : dir === 'forward' ? 'nav-forward' : '');
    if (dir === 'back') {
      const y = Number(memGet('wpi-scroll:' + location.pathname + location.search) || 0);
      if (y) requestAnimationFrame(() => window.scrollTo(0, y));
    }
  }, [pathname]);
  return <div className={cls}>{children}</div>;
}

export function RowLink({ href, className, children, ...rest }) {
  return (
    <Link
      href={href}
      className={className}
      {...rest}
      onClick={() => {
        memSet('wpi-dir', 'forward');
        memSet('wpi-scroll:' + location.pathname + location.search, String(window.scrollY));
        memSet('wpi-return', location.pathname + location.search);
      }}
    >
      {children}
    </Link>
  );
}

export function BackLink() {
  const [href, setHref] = useState('/events');
  useEffect(() => {
    const ret = memGet('wpi-return');
    if (ret.startsWith('/events')) setHref(ret);
  }, []);
  return (
    <p className="back">
      <Link className="back" href={href} onClick={() => { memSet('wpi-dir', 'back'); }}>
        ‹ Events
      </Link>
    </p>
  );
}

export function Holdings({ rows }) {
  const [open, setOpen] = useState({});
  return rows.map((r) => {
    const isOpen = !!open[r.ticker];
    return (
      <div className={isOpen ? 'hrow open' : 'hrow'} key={r.ticker}>
        <button type="button" className="hmain" aria-expanded={isOpen ? 'true' : 'false'} onClick={() => setOpen((s) => ({ ...s, [r.ticker]: !s[r.ticker] }))}>
          <span className="hn">{r.name}</span>
          <span className="hw">{r.weightText}%</span>
          <span className="wbar" aria-hidden="true"><i style={{ width: r.bar + '%' }} /></span>
        </button>
        <div className="hfold" hidden={!isOpen}>
          <p className="hval">{r.valueText}</p>
          {r.events.map((ev) => (
            <p className="linkrow" key={ev.id}>
              <RowLink className="rowlink" href={'/event/' + ev.id}>{ev.name} {ev.fig}%</RowLink>
              {' '}<span className="tag guess">Guess</span> {ev.guess}.
            </p>
          ))}
        </div>
      </div>
    );
  });
}
