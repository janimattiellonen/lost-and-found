import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import MessageComposer from './MessageComposer';

function renderComposer(ownerPhoneNumber?: string) {
  const Stub = createRoutesStub([
    {
      path: '/',
      Component: () => (
        <MessageComposer
          disc={{
            externalId: '11111111-1111-1111-1111-111111111111',
            discName: 'Destroyer',
            discColour: 'punainen',
            ownerName: 'Matti',
            ownerPhoneNumber,
          }}
          messageTemplates={[]}
          sentMessages={[]}
          onCancel={() => {}}
          baseUrl="https://example.test"
        />
      ),
    },
  ]);

  render(<Stub initialEntries={['/']} />);
}

describe('MessageComposer', () => {
  // The number is read-only text, but "Puhelinnumero" must still name it for a
  // screen reader rather than be a label attached to nothing.
  it('labels the read-only phone number', () => {
    renderComposer('0501234567');

    expect(screen.getByLabelText('Puhelinnumero').textContent).toBe('050 123 4567');
  });

  it('labels the placeholder when the disc has no number', () => {
    renderComposer(undefined);

    expect(screen.getByLabelText('Puhelinnumero').textContent).toBe('Ei puhelinnumeroa');
  });
});
