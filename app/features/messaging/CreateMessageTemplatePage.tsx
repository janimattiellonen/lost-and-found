import { Form, useNavigation } from 'react-router';

import type { MessageTemplateErrors } from '~/features/messaging/createMessageTemplateFromForm.server';
import TemplateCategorySelect from '~/features/messaging/TemplateCategorySelect';
import TemplateTokenHelp from '~/features/messaging/TemplateTokenHelp';
import type { MessageTemplateCategoryDTO } from '~/types';
import Button from '~/ui/Button';
import Checkbox from '~/ui/Checkbox';
import FormControlLabel from '~/ui/FormControlLabel';
import H2 from '~/ui/H2';
import Label from '~/ui/Label';
import TextField from '~/ui/TextField';
import Wrapper from '~/ui/Wrapper';

import type { JSX } from 'react';

type Props = {
  categories: MessageTemplateCategoryDTO[];
  errors?: MessageTemplateErrors | null;
};

export default function CreateMessageTemplatePage({ categories, errors }: Props): JSX.Element {
  const navigation = useNavigation();
  // Covers the redirect to the edit page as well as the post itself: the button
  // stays busy until the next page is on screen, so there is no dead moment
  // where nothing looks like it is happening.
  const isSaving = navigation.state !== 'idle' && navigation.formData != null;

  return (
    <div>
      <H2 className="mt-8 mb-4">Luo uusi viestipohja</H2>

      <TemplateTokenHelp />

      <Form method="post">
        <Wrapper>
          <Label htmlFor="content">Sisältö</Label>
          <TextField name="content" id="content" multiline rows={9} fullWidth />

          {errors?.content && <p className="text-red-500 text-xs italic">{errors.content}</p>}
        </Wrapper>

        <TemplateCategorySelect categories={categories} selected={null} />

        <Wrapper>
          <FormControlLabel control={<Checkbox name="is-default" />} label="Oletusviestipohja" />
        </Wrapper>

        <Button variant="contained" type="submit" disabled={isSaving}>
          {isSaving ? 'Luodaan...' : 'Luo'}
        </Button>
      </Form>
    </div>
  );
}
