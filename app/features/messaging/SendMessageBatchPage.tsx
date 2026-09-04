import { useState, type JSX } from 'react';

import { useNavigate } from 'react-router';

import type { ComposerDisc, ComposerMessage } from '~/features/messaging/composerData';
import MessageComposer from '~/features/messaging/MessageComposer';
import Button from '~/ui/Button';
import H2 from '~/ui/H2';
import type { MessageTemplateDTO } from '~/types';

type Props = {
  discs: ComposerDisc[];
  messageTemplates: MessageTemplateDTO[];
  sentMessagesByDisc: Record<string, ComposerMessage[]>;
  /** Set when the selection was larger than one batch may carry. */
  tooMany: { selected: number; max: number } | null;
  baseUrl: string;
};

/** A batch that cannot be started, and what to do about it. */
function CannotStart({ children }: { children: JSX.Element | string }): JSX.Element {
  return (
    <div>
      <H2 className="mt-8 mb-4">Viestin luonti</H2>
      <p className="mb-4">{children}</p>
      <Button variant="contained" to="/">
        Takaisin listaan
      </Button>
    </div>
  );
}

/**
 * Messaging the owners of a selection of discs, one after another.
 *
 * The same form as the single-disc page, worked through in the order the discs
 * were selected. Recording a send moves on to the next owner, and so does
 * abandoning one — either way the disc is done with. When the last one is
 * done, back to the list.
 *
 * Which disc is being composed is state, not a URL: the batch is one pass
 * through a selection, and putting the position in the URL would invite a back
 * button that re-sends.
 */
export default function SendMessageBatchPage({
  discs,
  messageTemplates,
  sentMessagesByDisc,
  tooMany,
  baseUrl,
}: Props): JSX.Element {
  const navigate = useNavigate();
  const [position, setPosition] = useState<number>(0);

  const disc = discs[position];

  const moveOn = (): void => {
    if (position + 1 >= discs.length) {
      navigate('/');

      return;
    }

    setPosition(position + 1);
  };

  if (tooMany) {
    return (
      <CannotStart>
        {`Valitsit ${tooMany.selected} kiekkoa. Yhdellä kertaa voi käsitellä enintään ${tooMany.max}, joten valitse listasta pienempi joukko.`}
      </CannotStart>
    );
  }

  // The loader sends an empty selection back to the list, so this is only what
  // is left if every selected disc has since been deleted.
  if (!disc) {
    return <CannotStart>Valituista kiekoista ei löytynyt yhtään.</CannotStart>;
  }

  return (
    <MessageComposer
      // Remounted per disc, which is what re-seeds the phone number, the
      // template and the message for the next owner.
      key={disc.externalId}
      disc={disc}
      messageTemplates={messageTemplates}
      sentMessages={(disc.externalId && sentMessagesByDisc[disc.externalId]) || []}
      progress={{ position: position + 1, total: discs.length }}
      baseUrl={baseUrl}
      onCancel={moveOn}
      onRecorded={moveOn}
    />
  );
}
