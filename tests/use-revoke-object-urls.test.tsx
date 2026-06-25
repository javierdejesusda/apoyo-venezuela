// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useRevokeObjectUrlsOnUnmount } from '@/lib/use-revoke-object-urls';

function Probe({ urls }: { urls: string[] }): null {
  useRevokeObjectUrlsOnUnmount(urls);
  return null;
}

afterEach(() => {
  cleanup();
});

describe('useRevokeObjectUrlsOnUnmount', () => {
  it('revokes every current object URL on unmount', () => {
    const revoke = vi.fn();
    URL.revokeObjectURL = revoke as unknown as typeof URL.revokeObjectURL;

    const { unmount } = render(<Probe urls={['blob:a', 'blob:b']} />);
    expect(revoke).not.toHaveBeenCalled();

    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:a');
    expect(revoke).toHaveBeenCalledWith('blob:b');
    expect(revoke).toHaveBeenCalledTimes(2);
  });

  it('revokes the latest URLs after the list changes', () => {
    const revoke = vi.fn();
    URL.revokeObjectURL = revoke as unknown as typeof URL.revokeObjectURL;

    const { rerender, unmount } = render(<Probe urls={['blob:a']} />);
    rerender(<Probe urls={['blob:a', 'blob:c']} />);

    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:a');
    expect(revoke).toHaveBeenCalledWith('blob:c');
    expect(revoke).toHaveBeenCalledTimes(2);
  });
});
