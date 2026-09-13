import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/mcp/route';

describe('mcp GET probe', () => {
  it('answers the connector probe as an event stream', () => {
    const res = GET();

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
  });

  it('closes immediately instead of holding a function open', async () => {
    const res = GET();

    // Draining must finish on its own. A stream kept alive by a heartbeat
    // would occupy the function until maxDuration and never settle here.
    const body = await res.text();

    expect(body).toContain(': connected');
    expect(body).not.toContain(': ping');
  });
});
