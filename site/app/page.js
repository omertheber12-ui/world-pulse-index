import { Footer } from './components/Footer.js';
import { TodaySkeleton } from './components/Skeletons.js';
import { TodayScreen } from './components/today/TodayScreen.js';
import { buildToday, demoAllowed, demoMode } from '../lib/todayScreen.js';

export const metadata = { title: 'Today · World Pulse Index' };

export default async function TodayPage({ searchParams }) {
  const sp = await searchParams;
  if (sp.state === 'loading') return <TodaySkeleton />;
  const model = buildToday(demoMode(sp.state, demoAllowed(process.env)));
  return (
    <>
      <TodayScreen model={model} />
      <Footer pulse={model.pulse} />
    </>
  );
}
