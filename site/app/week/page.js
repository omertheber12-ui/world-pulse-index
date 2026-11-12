import { Footer } from '../components/Footer.js';
import { WeekScreen } from '../components/today/WeekScreen.js';
import { buildWeek } from '../../lib/todayScreen.js';

export const metadata = { title: 'This week in one minute · World Pulse Index' };

export default function WeekPage() {
  const model = buildWeek();
  return (
    <>
      <WeekScreen model={model} />
      <Footer pulse={model.pulse} />
    </>
  );
}
