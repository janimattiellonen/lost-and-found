import { NO_CATEGORY } from '~/features/messaging/templateCategoryField';
import type { MessageTemplateCategoryDTO } from '~/types';
import Label from '~/ui/Label';
import Select, { MenuItem } from '~/ui/Select';
import Wrapper from '~/ui/Wrapper';

import type { JSX } from 'react';

type Props = {
  categories: MessageTemplateCategoryDTO[];
  /** The template's current category, or null for one in none. */
  selected: number | null;
};

/**
 * The category picker, shared by the create and the edit form so the two cannot
 * offer different options or post different field names.
 *
 * Uncontrolled: the value is only read when the form is submitted, and nothing
 * on either page reacts to it as it changes.
 */
export default function TemplateCategorySelect({ categories, selected }: Props): JSX.Element {
  return (
    <Wrapper>
      <Label htmlFor="category-id">Kategoria</Label>

      <Select fullWidth id="category-id" name="category-id" defaultValue={selected?.toString() ?? NO_CATEGORY}>
        <MenuItem value={NO_CATEGORY}>Ei kategoriaa</MenuItem>
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            {category.name}
          </MenuItem>
        ))}
      </Select>
    </Wrapper>
  );
}
