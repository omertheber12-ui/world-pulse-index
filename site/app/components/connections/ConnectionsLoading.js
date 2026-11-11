import { ConnFooter } from './TopBar.js';

export function ConnectionsLoading() {
  return (
    <>
      <main className="conn-wrap" data-page="connections" data-loading="1">
        <p className="conn-stand">Past data. Description only, not proven. Not a forecast and not advice.</p>
        <div className="conn-skel tall" />
        <div className="conn-card conn-chartcard"><div className="conn-skel chart" /></div>
        <div className="conn-skel" />
        <div className="conn-skel" />
        <div className="conn-skel" />
      </main>
      <ConnFooter />
    </>
  );
}
