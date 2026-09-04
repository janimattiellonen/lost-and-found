import { useState, type JSX } from 'react';

import { Form } from 'react-router';

import type { MessageTemplateErrors } from '~/features/messaging/createMessageTemplateFromForm.server';
import type { MessageTemplateDTO } from '~/types';
import TemplateTokenHelp from '~/features/messaging/TemplateTokenHelp';
import Button from '~/ui/Button';
import Checkbox from '~/ui/Checkbox';
import FormControlLabel from '~/ui/FormControlLabel';
import H2 from '~/ui/H2';
import Label from '~/ui/Label';
import TextField from '~/ui/TextField';
import Wrapper from '~/ui/Wrapper';

type Props = {
  messageTemplate: MessageTemplateDTO | null;
  errors?: MessageTemplateErrors | null;
};

export default function EditMessageTemplatePage({ messageTemplate, errors }: Props): JSX.Element {
  // Seeded from the loader data, then owned by the form: the page is remounted
  // per template, so there is nothing to sync afterwards.
  const [message, setMessage] = useState<string>(messageTemplate?.content ?? '');
  const [isDefault, setIsDefault] = useState<boolean>(messageTemplate?.isDefault ?? false);

  return (
    <div>
      <H2 className="mt-8 mb-4">Muokkaa viestipohjaa</H2>

      <TemplateTokenHelp />

      <Form method="post">
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

          <Button name="action" value="create" variant="contained" type="submit">
            Päivitä
          </Button>
        </div>
      </Form>
    </div>
  );
}
