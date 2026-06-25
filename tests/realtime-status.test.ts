import { describe, expect, it } from 'vitest';

import { interpretChannelStatus } from '@/lib/data/realtime-status';

describe('interpretChannelStatus', () => {
  it('treats SUBSCRIBED as live and settled', () => {
    expect(interpretChannelStatus('SUBSCRIBED')).toEqual({ live: true, settled: true });
  });

  it.each(['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'])(
    'treats %s as not live but settled',
    (status) => {
      expect(interpretChannelStatus(status)).toEqual({ live: false, settled: true });
    },
  );

  it('treats a transient status as unsettled (no definitive signal yet)', () => {
    expect(interpretChannelStatus('CONNECTING')).toEqual({ live: false, settled: false });
  });
});
