import {
  disposalMethodLabel,
  returnMethodLabel,
  type DisposalMethodValue,
  type ReturnMethodValue,
} from '~/discMethods';

/** The marks that take a disc off the front page, as the search reads them. */
export type DiscMarks = {
  isReturnedToOwner: boolean;
  returnedToOwnerDate: string | null;
  returnMethod: ReturnMethodValue | null;
  canBeSoldOrDonated: boolean;
  canBeSoldOrDonatedDate: string | null;
  canBeSoldOrDonatedMethod: DisposalMethodValue | null;
  archivedAt: string | null;
};

/** One line of the "Tila" column: what happened, and when, if that is known. */
type StatusLine = {
  label: string;
  date: string | null;
};

/**
 * Every mark a disc carries, in the order its story usually runs, or "Listalla"
 * (on the list) for a disc with none — one the front page shows too.
 *
 * All of them rather than the first: a disc can carry more than one (returned
 * and later archived, or both endings from old sheet data), and the page is
 * where an admin goes to find out what happened.
 */
export function discStatusLines(marks: DiscMarks): StatusLine[] {
  const lines: StatusLine[] = [];

  if (marks.isReturnedToOwner) {
    const method = returnMethodLabel(marks.returnMethod);

    lines.push({
      label: method ? `Palautettu omistajalle (${method})` : 'Palautettu omistajalle',
      date: marks.returnedToOwnerDate,
    });
  }

  if (marks.canBeSoldOrDonated) {
    lines.push({
      label: disposalMethodLabel(marks.canBeSoldOrDonatedMethod) ?? 'Myytävissä tai lahjoitettavissa',
      date: marks.canBeSoldOrDonatedDate,
    });
  }

  if (marks.archivedAt !== null) {
    lines.push({ label: 'Arkistoitu', date: marks.archivedAt });
  }

  return lines.length > 0 ? lines : [{ label: 'Listalla', date: null }];
}
