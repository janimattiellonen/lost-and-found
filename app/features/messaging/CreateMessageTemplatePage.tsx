import { Form } from 'react-router';

import type { MessageTemplateErrors } from '~/features/messaging/createMessageTemplateFromForm.server';
import TemplateTokenHelp from '~/features/messaging/TemplateTokenHelp';
import Button from '~/ui/Button';
import Checkbox from '~/ui/Checkbox';
import FormControlLabel from '~/ui/FormControlLabel';
import H2 from '~/ui/H2';
import Label from '~/ui/Label';
import TextField from '~/ui/TextField';
import Wrapper from '~/ui/Wrapper';

import type { JSX } from 'react';

type Props = {
  errors?: MessageTemplateErrors | null;
};

export default function CreateMessageTemplatePage({ errors }: Props): JSX.Element {
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

        <Wrapper>
          <FormControlLabel control={<Checkbox name="is-default" />} label="Oletusviestipohja" />
        </Wrapper>

        <Button variant="contained" type="submit">
          Luo
        </Button>
      </Form>
    </div>
  );
}
