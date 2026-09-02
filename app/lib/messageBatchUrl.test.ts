import { describe, expect, it } from 'vitest';

import { buildSendBatchHref, parseBatchIds } from '~/lib/messageBatchUrl';

const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
const C = '33333333-3333-3333-3333-333333333333';

describe('buildSendBatchHref', () => {
  it('carries the ids in the order they were selected', () => {
    expect(buildSendBatchHref([A, B])).toBe(`/message/send-batch?ids=${A},${B}`);
  });
});

describe('parseBatchIds', () => {
  it('reads the ids back in the order they were written', () => {
    expect(parseBatchIds(`${C},${A},${B}`)).toEqual([C, A, B]);
  });

  it('survives a round trip through the href', () => {
    const href = buildSendBatchHref([A, B, C]);

    expect(parseBatchIds(new URL(href, 'http://x').searchParams.get('ids'))).toEqual([A, B, C]);
  });

  it('drops anything that is not a uuid', () => {
    expect(parseBatchIds(`${A},nonsense,42,${B}`)).toEqual([A, B]);
  });

  it('keeps the first of a repeated id', () => {
    expect(parseBatchIds(`${A},${B},${A}`)).toEqual([A, B]);
  });

  it('tolerates stray whitespace and empty entries', () => {
    expect(parseBatchIds(` ${A} , , ${B}`)).toEqual([A, B]);
  });

  it('returns nothing for a missing or empty parameter', () => {
    expect(parseBatchIds(null)).toEqual([]);
    expect(parseBatchIds('')).toEqual([]);
    expect(parseBatchIds(',,')).toEqual([]);
  });
});
