import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRoutesStub, Link, useLoaderData, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { readDiscSearch } from './discSearch';
import DiscSearchPage from './DiscSearchPage';
import type { DiscSearchPageData } from './loadDiscSearchPage.server';
import type { FoundDisc } from './queryDiscSearch.server';

const returnedDisc: FoundDisc = {
  externalId: '06adc151-9f6e-48a4-9abf-23e455150c38',
  discName: 'Stingray',
  discColour: 'Oranssi',
  ownerName: 'Ville',
  ownerPhoneNumber: '+358501112222',
  addedAt: '2026-07-04T00:00:00+00:00',
  course: 'Oittaa',
  isReturnedToOwner: true,
  returnedToOwnerDate: '2026-10-02',
  returnMethod: 1,
  canBeSoldOrDonated: false,
  canBeSoldOrDonatedDate: null,
  canBeSoldOrDonatedMethod: null,
  archivedAt: null,
};

/** The page at an address, with a loader that answers whatever the address asks. */
function renderAt(
  address: string,
  results: (search: string) => Partial<DiscSearchPageData> | Promise<Partial<DiscSearchPageData>>,
) {
  const Stub = createRoutesStub([
    {
      path: '/admin/discs',
      loader: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const search = readDiscSearch({ phone: params.get('phone'), disc: params.get('disc') });

        return {
          search,
          results: null,
          truncated: false,
          showCourse: false,
          ...(await results(params.toString())),
        } satisfies DiscSearchPageData;
      },
      Component: () => {
        const data = useLoaderData<DiscSearchPageData>();
        const location = useLocation();

        return (
          <>
            <output data-testid="address">{location.search}</output>
            <Link to="/admin/discs">Kaikki kiekot -valikossa</Link>
            <DiscSearchPage {...data} />
          </>
        );
      },
    },
  ]);

  render(<Stub initialEntries={[address]} />);
}

/** A loader answer the test releases when it chooses, to look at the page while it waits. */
function deferred() {
  let release: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });

  return { promise, release };
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('DiscSearchPage', () => {
  it('shows only the fields until something is searched', async () => {
    renderAt('/admin/discs', () => ({}));

    expect(await screen.findByLabelText('Puhelinnumero')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByText('Hakuehdoilla ei löytynyt kiekkoja.')).toBeNull();
  });

  it('says so when a search finds nothing', async () => {
    renderAt('/admin/discs?disc=Zzz', () => ({ results: [] }));

    expect(await screen.findByText('Hakuehdoilla ei löytynyt kiekkoja.')).toBeTruthy();
  });

  it('shows a closed disc with its status, and its number as an admin reads it', async () => {
    renderAt('/admin/discs?phone=0501112222', () => ({ results: [returnedDisc] }));

    expect(await screen.findByText('Stingray')).toBeTruthy();
    expect(screen.getByText('050 111 2222')).toBeTruthy();
    expect(screen.getByText('Palautettu omistajalle (Noudettu)')).toBeTruthy();
  });

  it('links to the edit page with this search as the way back', async () => {
    renderAt('/admin/discs?phone=0501112222', () => ({ results: [returnedDisc] }));

    const link = await screen.findByRole('link', { name: 'Muokkaa kiekon Stingray tietoja' });

    expect(link.getAttribute('href')).toBe(
      '/discs/06adc151-9f6e-48a4-9abf-23e455150c38/edit?returnTo=%2Fadmin%2Fdiscs%3Fphone%3D0501112222',
    );
  });

  it('shows the course column only for a club that records courses', async () => {
    renderAt('/admin/discs?phone=0501112222', () => ({ results: [returnedDisc], showCourse: true }));

    expect(await screen.findByRole('columnheader', { name: 'Rata' })).toBeTruthy();
  });

  it('says when there were more discs than it shows', async () => {
    renderAt('/admin/discs?disc=Star', () => ({ results: [returnedDisc], truncated: true }));

    expect(await screen.findByText('Näytetään 100 uusinta. Tarkenna hakua.')).toBeTruthy();
  });

  it('comes back with the fields filled in with what was searched', async () => {
    renderAt('/admin/discs?phone=0501112222&disc=Star', () => ({ results: [] }));

    expect(((await screen.findByLabelText('Puhelinnumero')) as HTMLInputElement).value).toBe('0501112222');
    expect((screen.getByLabelText('Kiekko') as HTMLInputElement).value).toBe('Star');
  });

  it('searches once typing pauses, with the number in its search form', async () => {
    renderAt('/admin/discs', () => ({ results: [] }));

    fireEvent.change(await screen.findByLabelText('Puhelinnumero'), { target: { value: '050 111 2222' } });

    await waitFor(() => expect(screen.getByTestId('address').textContent).toBe('?phone=0501112222'));
  });

  // Browsers submit a form on Enter only when it has a submit button or a
  // single text field; this one has two fields, so the button is what makes
  // Enter work at all. jsdom does not model that, so it is checked directly.
  it('has a submit button, so Enter submits the form', async () => {
    renderAt('/admin/discs', () => ({}));

    const button = await screen.findByRole('button', { name: 'Hae', hidden: true });

    expect(button.getAttribute('type')).toBe('submit');
    expect(button.closest('form')).toBe(screen.getByLabelText('Kiekko').closest('form'));
  });

  it('searches at once on Enter', async () => {
    renderAt('/admin/discs', () => ({ results: [] }));

    const field = await screen.findByLabelText('Kiekko');

    fireEvent.change(field, { target: { value: 'Star' } });
    fireEvent.submit(field.closest('form')!);

    await waitFor(() => expect(screen.getByTestId('address').textContent).toBe('?disc=Star'), { timeout: 200 });
  });

  it('clears the search when the fields no longer hold enough', async () => {
    renderAt('/admin/discs?disc=Star', () => ({ results: [] }));

    const field = await screen.findByLabelText('Kiekko');

    fireEvent.change(field, { target: { value: 'S' } });

    await waitFor(() => expect(screen.getByTestId('address').textContent).toBe(''));
  });
  it('fetches nothing for a space, a dash or a first letter in an empty field', async () => {
    const asked: string[] = [];

    renderAt('/admin/discs', (search) => {
      asked.push(search);
      return {};
    });

    const field = await screen.findByLabelText('Kiekko');

    fireEvent.change(field, { target: { value: ' ' } });
    fireEvent.change(field, { target: { value: '-' } });
    fireEvent.change(field, { target: { value: 'S' } });
    await pause(450);

    expect(screen.getByTestId('address').textContent).toBe('');
    expect(asked).toEqual(['']);
  });

  it('starts the wait again on every keypress', async () => {
    const asked: string[] = [];

    renderAt('/admin/discs', (search) => {
      asked.push(search);
      return {};
    });

    const field = await screen.findByLabelText('Kiekko');

    fireEvent.change(field, { target: { value: 'St' } });
    await pause(200);
    fireEvent.change(field, { target: { value: 'Sti' } });
    await pause(200);

    // 400 ms after the first keypress, but only 200 after the last.
    expect(screen.getByTestId('address').textContent).toBe('');

    await waitFor(() => expect(screen.getByTestId('address').textContent).toBe('?disc=Sti'));
    expect(asked).not.toContain('disc=St');
  });

  it('empties the fields when the menu link is followed from a search', async () => {
    renderAt('/admin/discs?phone=0501112222&disc=Star', () => ({ results: [] }));

    expect(((await screen.findByLabelText('Kiekko')) as HTMLInputElement).value).toBe('Star');

    fireEvent.click(screen.getByRole('link', { name: 'Kaikki kiekot -valikossa' }));

    await waitFor(() => expect((screen.getByLabelText('Kiekko') as HTMLInputElement).value).toBe(''));
    expect((screen.getByLabelText('Puhelinnumero') as HTMLInputElement).value).toBe('');
  });

  it('empties the fields when the menu link is followed while a search is still loading', async () => {
    const slow = deferred();

    renderAt('/admin/discs', async (search) => {
      if (search === 'disc=ab') {
        await slow.promise;
      }

      return {};
    });

    const field = (await screen.findByLabelText('Kiekko')) as HTMLInputElement;

    fireEvent.change(field, { target: { value: 'ab' } });
    await pause(450);
    fireEvent.click(screen.getByRole('link', { name: 'Kaikki kiekot -valikossa' }));

    await waitFor(() => expect(field.value).toBe(''));

    // Typing the same thing again is a search again, not "nothing changed".
    fireEvent.change(field, { target: { value: 'ab' } });
    slow.release();

    await waitFor(() => expect(screen.getByTestId('address').textContent).toBe('?disc=ab'));
  });

  it('dims the results and marks them busy while a search loads', async () => {
    const slow = deferred();

    renderAt('/admin/discs?disc=Zzz', async (search) => {
      if (search === 'disc=Zzy') {
        await slow.promise;
      }

      return { results: [] };
    });

    const results = (await screen.findByText('Hakuehdoilla ei löytynyt kiekkoja.')).parentElement!;

    expect(results.getAttribute('aria-busy')).toBe('false');

    fireEvent.change(screen.getByLabelText('Kiekko'), { target: { value: 'Zzy' } });
    fireEvent.submit(screen.getByLabelText('Kiekko').closest('form')!);

    await waitFor(() => expect(results.getAttribute('aria-busy')).toBe('true'));
    expect(results.className).toContain('opacity-50');

    slow.release();

    await waitFor(() => expect(results.getAttribute('aria-busy')).toBe('false'));
    expect(results.className).not.toContain('opacity-50');
  });
});
