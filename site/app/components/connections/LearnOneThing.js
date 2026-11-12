'use client';

import { useEffect, useRef, useState } from 'react';
import { LEARN_ENTRY, LEARN_SOURCE } from '../../../lib/screenCopy.js';

export function LearnOneThing({ cards }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const dialogRef = useRef(null);
  const startRef = useRef(null);
  function close() {
    setOpen(false);
    setStep(0);
    if (startRef.current) startRef.current.focus();
  }

  useEffect(() => {
    if (!open) return undefined;
    const node = dialogRef.current;
    const heading = node && node.querySelector('[data-learn-title]');
    if (heading) heading.focus();
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll('button, a[href]')];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, step]);

  return (
    <section className="cx-card cx-pad cx-learn" data-learn-entry="1">
      <h2>{LEARN_ENTRY.title}</h2>
      <p className="cx-sub2">{LEARN_ENTRY.body}</p>
      <button ref={startRef} type="button" className="cx-learn-start" onClick={() => { setStep(0); setOpen(true); }}>
        {LEARN_ENTRY.start}
      </button>
      <div className="cx-learn-overlay" hidden={!open} onClick={close}>
        <div
          ref={dialogRef}
          className="cx-learn-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="learn-title"
          onClick={(event) => event.stopPropagation()}
        >
          <h2 id="learn-title" data-learn-title="1" tabIndex={-1}>
            {'Learn one thing · ' + (step + 1) + ' of 3'}
          </h2>
          <p className="cx-learn-progress">
            <span className="cx-dots" aria-hidden="true">
              {cards.map((item, index) => <i key={item.topic} className={index === step ? 'on' : ''} />)}
            </span>
            <span>{(step + 1) + ' of 3'}</span>
          </p>
          {cards.map((item, index) => (
            <div key={item.topic} hidden={index !== step}>
              <p className="cx-learn-topic">{item.topic}</p>
              <p className="cx-learn-body">{item.body}</p>
            </div>
          ))}
          <p className="cx-learn-source">{LEARN_SOURCE}</p>
          <div className="cx-learn-actions">
            <button type="button" aria-disabled={step === 0 ? 'true' : 'false'} onClick={() => { if (step > 0) setStep(step - 1); }}>
              Back
            </button>
            {step < cards.length - 1 ? (
              <button type="button" className="cx-learn-next" onClick={() => setStep(step + 1)}>Next</button>
            ) : (
              <button type="button" className="cx-learn-next" onClick={close}>Got it</button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
