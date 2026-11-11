import { ConnFooter } from './TopBar.js';

export function ConnectionsLoading() {
  return (
    <>
      <main className="cx-wrap" data-page="connections" data-loading="1">
        <p className="cx-stand">Past data. Description only, not proven. Not a forecast and not advice.</p>
        <div className="cx-skel tall" />
        <div className="cx-card cx-chartcard"><div className="cx-skel chart" /></div>
        <div className="cx-skel" />
        <div className="cx-skel" />
        <div className="cx-skel" />
      </main>
      <ConnFooter />
    </>
  );
}
