import { useState, type JSX } from 'react';

import { Form, useNavigation } from 'react-router';

import type { MessageTemplateErrors } from '~/features/messaging/createMessageTemplateFromForm.server';
import type { MessageTemplateCategoryDTO, MessageTemplateDTO } from '~/types';
import TemplateCategorySelect from '~/features/messaging/TemplateCategorySelect';
import TemplateTokenHelp from '~/features/messaging/TemplateTokenHelp';
import Button from '~/ui/Button';
import Checkbox from '~/ui/Checkbox';
import FormControlLabel from '~/ui/FormControlLabel';
import H2 from '~/ui/H2';
import Label from '~/ui/Label';
import SuccessNote from '~/ui/SuccessNote';
import TextField from '~/ui/TextField';
import Wrapper from '~/ui/Wrapper';

type Props = {
  messageTemplate: MessageTemplateDTO | null;
  categories: MessageTemplateCategoryDTO[];
  errors?: MessageTemplateErrors | null;
  /** The save this page's own action just made. */
  saved?: boolean;
  /** Arrived here straight from the create form, which redirects here. */
  justCreated?: boolean;
};

export default function EditMessageTemplatePage({
  messageTemplate,
  categories,
  errors,
  saved,
  justCreated,
}: Props): JSX.Element {
  // Seeded from the loader data, then owned by the form: the page is remounted
  // per template, so there is nothing to sync afterwards.
  const [message, setMessage] = useState<string>(messageTemplate?.content ?? '');
  const [isDefault, setIsDefault] = useState<boolean>(messageTemplate?.isDefault ?? false);
  // Typing after a save makes the "saved" line a lie -- what is on screen is no
  // longer what is stored -- so the first edit takes it away again.
  const [isEdited, setIsEdited] = useState(false);

  const navigation = useNavigation();
  const isSaving = navigation.state !== 'idle' && navigation.formData != null;

  // "Luotu" only until the first save on this page, after which "tallennettu"
  // is the truer word even though the ?created marker is still in the URL.
  const notice = saved ? 'Viestipohja tallennettu.' : justCreated ? 'Viestipohja luotu.' : null;

  return (
    <div>
      <H2 className="mt-8 mb-4">Muokkaa viestipohjaa</H2>

      <TemplateTokenHelp />

      <SuccessNote className="mb-4">{!isEdited && !isSaving && notice}</SuccessNote>

      <Form
        method="post"
        onChange={() => {
          setIsEdited(true);
        }}
        onSubmit={() => {
          setIsEdited(false);
        }}
      >
        <Wrapper>
          <Label htmlFor="content">Sisältö</Label>
          <TextField
            name="content"
            id="content"
            multiline
            rows={9}
            fullWidth
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          />

          {errors?.content && <p className="text-red-500 text-xs italic">{errors.content}</p>}
        </Wrapper>

        <TemplateCategorySelect categories={categories} selected={messageTemplate?.categoryId ?? null} />

        <Wrapper>
          <FormControlLabel
            control={
              <Checkbox
                name="is-default"
                value={isDefault}
                checked={isDefault}
                onChange={(e) => {
                  setIsDefault(e.target.checked);
                }}
              />
            }
            label="Oletusviestipohja"
          />
        </Wrapper>

        <div className="flex justify-start gap-4">
          <Button color="error" variant="contained" to={`/message-templates`}>
            Peru
          </Button>

          <Button name="action" value="create" variant="contained" type="submit" disabled={isSaving}>
            {isSaving ? 'Tallennetaan...' : 'Päivitä'}
          </Button>
        </div>
      </Form>
    </div>
  );
}
