import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PhoneNumberEditor from './PhoneNumberEditor';

const EXTERNAL_ID = '11111111-1111-1111-1111-111111111111';

function answer(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

function renderEditor() {
  const onSaved = vi.fn();
  const onCancel = vi.fn();

  render(
    <PhoneNumberEditor externalId={EXTERNAL_ID} phoneNumber="050 123 4567" onSaved={onSaved} onCancel={onCancel} />,
  );

  return { onSaved, onCancel, field: screen.getByRole('textbox') as HTMLInputElement };
}

describe('PhoneNumberEditor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens with the number the composer is showing', () => {
    const { field } = renderEditor();

    expect(field.value).toBe('050 123 4567');
  });

  it('saves the typed number to the disc and hands back the stored one', async () => {
    const fetchMock = answer(200, { phoneNumber: '040 765 4321' });
    const { onSaved, field } = renderEditor();

    fireEvent.change(field, { target: { value: ' 040 765 4321 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tallenna' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('040 765 4321'));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/message/phone-number');
    expect(JSON.parse(init.body)).toEqual({ externalId: EXTERNAL_ID, phoneNumber: ' 040 765 4321 ' });
  });

  it('stays open with the reason when the save is refused', async () => {
    answer(422, { error: 'Puhelinnumero on pakollinen.' });
    const { onSaved, field } = renderEditor();

    fireEvent.change(field, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tallenna' }));

    expect(await screen.findByText('Puhelinnumero on pakollinen.')).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
    expect(field.value).toBe('');
  });

  it('does not post a number saved unchanged', () => {
    const fetchMock = answer(200, {});
    const { onSaved } = renderEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Tallenna' }));

    expect(onSaved).toHaveBeenCalledWith('050 123 4567');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cannot be cancelled while the save is in flight', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    const { field } = renderEditor();

    fireEvent.change(field, { target: { value: '040 765 4321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tallenna' }));

    expect(await screen.findByRole('button', { name: 'Tallennetaan...' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Peruuta' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('cancels without saving anything', () => {
    const fetchMock = answer(200, {});
    const { onCancel, onSaved, field } = renderEditor();

    fireEvent.change(field, { target: { value: '040 000 0000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Peruuta' }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSaved).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
