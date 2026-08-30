/**
 * Archives discs the club has stopped listing.
 *
 * Sets `archived_at` on unresolved discs added before a cutoff date, so they
 * drop off the public list without being recorded as returned or sold — see
 * supabase/migrations/20260830000000_discs_archived_at.sql.
 *
 * Run it with:
 *   npm run archive:discs -- --before=2025-09-01 --dry-run
 *   npm run archive:discs -- --before=2025-09-01
 *
 * Flags:
 *   --before=YYYY-MM-DD  archive discs added strictly before this date (required)
 *   --club=<id>          which club (defaults to APP_CLUB_ID)
 *   --dry-run            print what would be archived, write nothing
 *
 * Reversible: `UPDATE discs SET archived_at = NULL WHERE ...` puts them back.
 *
 * Writing needs more than the anon key; see createWriteConnection.
 *
 * Runs on plain node (>= 22) via its native TypeScript stripping, so nothing in
 * this file's import graph may use the `~/` alias at runtime.
 */
import { createReadConnection, createWriteConnection, requireEnv } from './supabaseClients.ts';

/** Supabase caps a select at 1000 rows. */
const PAGE_SIZE = 1000;

/** Matches the chunking the import script uses. */
const UPDATE_CHUNK_SIZE = 100;

type StaleDisc = {
  external_id: string;
  internal_disc_id: number | null;
  disc_name: string;
  added_at: string | null;
  course: string | null;
};

function flag(name: string): string | undefined {
  return process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
}

function requireCutoff(): string {
  const before = flag('before');

  if (!before || !/^\d{4}-\d{2}-\d{2}$/.test(before)) {
    throw new Error('Pass the cutoff as --before=YYYY-MM-DD, e.g. --before=2025-09-01.');
  }

  return before;
}

/**
 * Discs that would disappear from the public list: still listed, added before
 * the cutoff, and neither returned nor released for sale or donation.
 */
async function getStaleDiscs(clubId: number, before: string): Promise<StaleDisc[]> {
  const supabase = createReadConnection();
  const discs: StaleDisc[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('discs')
      .select('external_id, internal_disc_id, disc_name, added_at, course')
      .eq('club_id', clubId)
      .eq('is_returned_to_owner', false)
      .eq('can_be_sold_or_donated', false)
      .is('archived_at', null)
      .lt('added_at', before)
      .order('added_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Reading discs failed: ${error.message}`);
    }

    discs.push(...((data ?? []) as StaleDisc[]));

    if (!data || data.length < PAGE_SIZE) {
      return discs;
    }
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

async function archive(discs: StaleDisc[]): Promise<void> {
  const supabase = await createWriteConnection();
  const archivedAt = new Date().toISOString();

  let archived = 0;

  // Addressed by external_id rather than by repeating the filters, so a disc
  // returned between the read and the write is not archived behind your back.
  for (const batch of chunk(discs, UPDATE_CHUNK_SIZE)) {
    const { error } = await supabase
      .from('discs')
      .update({ archived_at: archivedAt })
      .in(
        'external_id',
        batch.map((disc) => disc.external_id),
      );

    if (error) {
      throw new Error(`Archiving failed after ${archived} discs: ${error.message}`);
    }

    archived += batch.length;
    console.log(`  archived ${archived}/${discs.length}`);
  }
}

function countByYear(discs: StaleDisc[]): Record<string, number> {
  const counts: Record<string, number> = {};

  discs.forEach((disc) => {
    const year = disc.added_at?.slice(0, 4) ?? '(no date)';
    counts[year] = (counts[year] ?? 0) + 1;
  });

  return counts;
}

async function main(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');
  const before = requireCutoff();
  const clubId = Number(flag('club') ?? requireEnv('APP_CLUB_ID'));

  console.log(isDryRun ? 'DRY RUN — nothing will be written.\n' : 'Archiving for real.\n');
  console.log(`Club ${clubId}, discs added before ${before}.`);

  const discs = await getStaleDiscs(clubId, before);

  console.log(`Unresolved discs still listed: ${discs.length}`);

  if (discs.length === 0) {
    console.log('\nNothing to do.');
    return;
  }

  console.log('By year added:', countByYear(discs));
  console.log('\nDiscs that would be archived:');
  discs.forEach((disc) =>
    console.log(`  ${disc.added_at?.slice(0, 10)}  id ${disc.internal_disc_id ?? '-'}  ${disc.disc_name}`),
  );

  if (isDryRun) {
    console.log('\nDry run — nothing was written.');
    return;
  }

  console.log('');
  await archive(discs);
  console.log('\nDone. Clear archived_at to put a disc back on the list.');
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
