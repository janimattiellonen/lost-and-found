import { Form } from 'react-router';

import type { CategoryError } from './handleMessageTemplateCategoryAction.server';
import type { MessageTemplateCategoryDTO } from '~/types';
import Button from '~/ui/Button';
import H2 from '~/ui/H2';
import Label from '~/ui/Label';
import Paper from '~/ui/Paper';
import TextField from '~/ui/TextField';
import Wrapper from '~/ui/Wrapper';

import type { JSX } from 'react';

type Props = {
  categories: MessageTemplateCategoryDTO[];
  error?: CategoryError | null;
};

/**
 * Managing the groups a message template can belong to.
 *
 * Everything on one page rather than the create/edit pair the templates
 * themselves have: a category is a single name, and a separate page per name
 * would be two navigations to fix a typo.
 */
export default function MessageTemplateCategoriesPage({ categories, error }: Props): JSX.Element {
  return (
    <div>
      <H2 className="mt-8 mb-2">Viestipohjien kategoriat</H2>

      <p className="mb-6 max-w-2xl text-sm text-gray-600">
        Kategoria rajaa, mitkä viestipohjat ovat tarjolla missäkin tilanteessa. Viestipohja saa olla myös ilman
        kategoriaa. Kategorian poistaminen ei poista sen viestipohjia.
      </p>

      <Paper className="mb-8 max-w-2xl p-4">
        <Form method="post">
          <Label htmlFor="new-category">Lisää kategoria</Label>

          {/* Keyed on how many categories there are, so a successful add gives
              the field a fresh, empty one instead of leaving the name typed in
              it beside the row it just became. */}
          <TextField key={categories.length} id="new-category" name="name" fullWidth />

          {error && error.categoryId === null && <p className="text-red-500 text-xs italic">{error.message}</p>}

          <div className="mt-4 flex justify-end">
            <Button name="action" value="create" variant="contained" type="submit">
              Lisää
            </Button>
          </div>
        </Form>
      </Paper>

      {categories.length === 0 && <p className="text-gray-500">Ei kategorioita.</p>}

      <Wrapper>
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} error={error} />
        ))}
      </Wrapper>
    </div>
  );
}

function CategoryRow({ category, error }: { category: MessageTemplateCategoryDTO; error?: CategoryError | null }) {
  const rowError = error && error.categoryId === category.id ? error.message : null;

  return (
    <Paper className="mb-4 max-w-2xl p-4">
      <Form method="post">
        <input type="hidden" name="id" value={category.id} />

        <Label htmlFor={`category-${category.id}`}>Nimi</Label>
        <TextField id={`category-${category.id}`} name="name" defaultValue={category.name} fullWidth />

        {rowError && <p className="text-red-500 text-xs italic">{rowError}</p>}

        <div className="mt-4 flex justify-end gap-4">
          <Button name="action" value="rename" type="submit">
            Tallenna
          </Button>

          {/* Confirmed, and the confirmation says what does not happen: an
              admin should not have to guess whether the templates go too. */}
          <Button
            color="error"
            variant="contained"
            name="action"
            value="delete"
            type="submit"
            onClick={(e) => {
              if (!confirm(`Poistetaanko kategoria "${category.name}"? Sen viestipohjat säilyvät.`)) {
                e.preventDefault();
              }
            }}
          >
            Poista
          </Button>
        </div>
      </Form>
    </Paper>
  );
}
