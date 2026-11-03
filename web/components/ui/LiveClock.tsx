import React, { useEffect, useState } from 'react';
import { formatFullDateId, formatTimeWib } from '../../utils/format';

interface LiveClockProps {
  serverTimeIso?: string;
}

export const LiveClock: React.FC<LiveClockProps> = ({ serverTimeIso }) => {
  const [offsetMs, setOffsetMs] = useState<number>(0);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (serverTimeIso) {
      const serverTs = new Date(serverTimeIso).getTime();
      if (!Number.isNaN(serverTs)) {
        setOffsetMs(serverTs - Date.now());
      }
    }
  }, [serverTimeIso]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date(Date.now() + offsetMs));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [offsetMs]);

  return (
    <div>
      <div
        className="tabular-nums"
        style={{
          fontSize: '26px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          lineHeight: 1.2,
        }}
      >
        {formatTimeWib(now.toISOString(), true)}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
        {formatFullDateId(now)}
      </div>
    </div>
  );
};

