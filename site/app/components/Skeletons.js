function Rows({ n }) {
  return Array.from({ length: n }, (_, i) => <div className="sk row" key={i} />);
}

export function TodaySkeleton() {
  return (
    <main>
      <div className="sk tall" />
      <div className="sk" style={{ width: '70%' }} />
      <div className="sk num" />
      <div className="sk" style={{ width: '88%' }} />
      <Rows n={5} />
    </main>
  );
}

export function EventsSkeleton() {
  return (
    <main>
      <div className="sk" style={{ width: '40%' }} />
      <div className="sk" style={{ width: '100%', height: 32 }} />
      <Rows n={8} />
    </main>
  );
}

export function EventSkeleton() {
  return (
    <main>
      <div className="sk" style={{ width: '30%' }} />
      <div className="sk tall" />
      <div className="sk num" />
      <div className="sk chart" />
      <Rows n={5} />
    </main>
  );
}

export function PortfolioSkeleton() {
  return (
    <main>
      <div className="sk num" />
      <div className="sk" style={{ width: '55%' }} />
      <Rows n={6} />
    </main>
  );
}

export function HowSkeleton() {
  return (
    <main>
      <div className="sk tall" />
      <div className="sk" />
      <div className="sk" />
      <div className="sk" />
      <div className="sk" style={{ width: '80%' }} />
    </main>
  );
}
