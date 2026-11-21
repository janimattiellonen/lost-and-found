import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import type { DiscEditValues } from '~/features/discs/edit/discEdit';

import EditDiscPage from './EditDiscPage';

function renderPage(ownerPhoneNumber: string | null, returnTo = '/') {
  const disc: DiscEditValues = {
    discName: 'Destroyer, Star',
    discColour: 'punainen',
    discManufacturer: 'Innova',
    ownerName: 'Matti',
    ownerPhoneNumber,
    course: null,
    additionalInfo: null,
    isReturnedToOwner: false,
    returnedToOwnerDate: null,
    returnMethod: null,
    canBeSoldOrDonated: false,
    canBeSoldOrDonatedDate: null,
    canBeSoldOrDonatedMethod: null,
  };
  const Stub = createRoutesStub([
    { path: '/', Component: () => <EditDiscPage disc={disc} courses={[]} returnTo={returnTo} /> },
  ]);

  render(<Stub initialEntries={['/']} />);
}

describe('EditDiscPage phone number field', () => {
  // Spec 16: the field opens on the number as an owner knows it, not the stored form.
  it('opens a stored Finnish number in its domestic form', () => {
    renderPage('+358501112222');

    expect((screen.getByLabelText('Puhelinnumero') as HTMLInputElement).value).toBe('050 111 2222');
  });

  it('opens the anonymised tail as it is stored', () => {
    renderPage('2222');

    expect((screen.getByLabelText('Puhelinnumero') as HTMLInputElement).value).toBe('2222');
  });
});

describe('EditDiscPage "Peru"', () => {
  // Spec 14: "Peru" goes back to the page that opened the form.
  it('leads back to the search the admin came from', () => {
    renderPage('+358501112222', '/admin/discs?phone=0501112222');

    expect(screen.getByRole('link', { name: 'Peru' }).getAttribute('href')).toBe('/admin/discs?phone=0501112222');
  });

  it('leads to the disc list by default', () => {
    renderPage('+358501112222');

    expect(screen.getByRole('link', { name: 'Peru' }).getAttribute('href')).toBe('/');
  });
});
