/**
 * Imports the Puskasoturit lost-disc sheet into `discs`, adding only.
 *
 * Unlike the sync in app/models/syncDiscs.server.ts, this never deletes: it
 * reads which (internal_disc_id, club_id) pairs the table already holds and
 * inserts the rest. internal_disc_id is not unique on its own — the same number
 * exists once for each club — so the club is always part of the comparison.
 *
 * Run it with:
 *   npm run import:puskasoturit -- --dry-run    # print what would be inserted
 *   npm run import:puskasoturit                 # actually insert
 *
 * Inserting needs write access to `discs`; see createWriteConnection.
 *
 * Runs on plain node (>= 22) via its native TypeScript stripping, so nothing in
 * this file's import graph may use the `~/` alias at runtime.
 */
import { importDiscData } from '../app/import/PuskaSoturitImporter.ts';
import { toDiscRow, type DiscRow } from '../app/import/puskasoturitDiscFields.ts';
import { createReadConnection, createWriteConnection } from './supabaseClients.ts';

const PUSKASOTURIT_CLUB_ID = 1;

/** Supabase caps a select at 1000 rows, so the existing ids come back in pages. */
const PAGE_SIZE = 1000;

/** Matches the chunking the in-app sync uses. */
const INSERT_CHUNK_SIZE = 100;

/** Every internal_disc_id this club already has a row for. */
async function getPersistedInternalDiscIds(clubId: number): Promise<Set<number>> {
  const supabase = createReadConnection();
  const ids = new Set<number>();

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('discs')
      .select('internal_disc_id')
      .eq('club_id', clubId)
      // Discs added through the web app have no internal_disc_id and cannot
      // collide with a sheet row.
      .not('internal_disc_id', 'is', null)
      .order('internal_disc_id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Reading existing discs failed: ${error.message}`);
    }

    data?.forEach((row) => ids.add(Number(row.internal_disc_id)));

    if (!data || data.length < PAGE_SIZE) {
      return ids;
    }
  }
}

function chunk(rows: DiscRow[], size: number): DiscRow[][] {
  const chunks: DiscRow[][] = [];

  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }

  return chunks;
}

async function insertRows(rows: DiscRow[]): Promise<void> {
  const supabase = await createWriteConnection();

  let inserted = 0;

  // Awaited one chunk at a time: a failure then stops the run instead of
  // leaving the rest to fail unnoticed in the background.
  for (const batch of chunk(rows, INSERT_CHUNK_SIZE)) {
    const { error } = await supabase.from('discs').insert(batch);

    if (error) {
      throw new Error(`Insert failed after ${inserted} discs: ${error.message}`);
    }

    inserted += batch.length;
    console.log(`  inserted ${inserted}/${rows.length}`);
  }
}

function countBy(rows: DiscRow[], key: (row: DiscRow) => string): Record<string, number> {
  const counts: Record<string, number> = {};

  rows.forEach((row) => {
    const value = key(row);
    counts[value] = (counts[value] ?? 0) + 1;
  });

  return counts;
}

function report(rows: DiscRow[]): void {
  console.log(
    '\nBy course:',
    countBy(rows, (row) => row.course ?? '(none)'),
  );
  console.log('Returned to owner:', rows.filter((row) => row.is_returned_to_owner).length);
  console.log('With a parsed return date:', rows.filter((row) => row.returned_to_owner_date).length);
  console.log('With a parsed return method:', rows.filter((row) => row.return_method !== null).length);
  console.log('For sale or donation:', rows.filter((row) => row.can_be_sold_or_donated).length);
  console.log(
    'With a parsed disposal method:',
    rows.filter((row) => row.can_be_sold_or_donated_method !== null).length,
  );
}

async function main(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(isDryRun ? 'DRY RUN — nothing will be written.\n' : 'Importing for real.\n');

  const discs = await importDiscData();
  console.log(`Sheet rows with a disc name, a date and an id: ${discs.length}`);

  const persisted = await getPersistedInternalDiscIds(PUSKASOTURIT_CLUB_ID);
  console.log(`Already in the database for club ${PUSKASOTURIT_CLUB_ID}: ${persisted.size}`);

  const newDiscs = discs.filter((disc) => !persisted.has(Number(disc.internalDiscId)));

  // A row whose date cell the sheet holds as something other than dd/MM/y (one
  // currently reads "9248"). Rather than insert a disc with no added_at, name
  // it so the sheet can be corrected and the disc picked up on the next run.
  const unreadable = newDiscs.filter((disc) => !disc.addedAt);

  if (unreadable.length > 0) {
    console.log(`\nSkipped ${unreadable.length} disc(s) whose "Lisätty" date could not be read:`);
    unreadable.forEach((disc) => console.log(`  id ${disc.internalDiscId}: ${disc.discName}`));
  }

  const rows = newDiscs.filter((disc) => disc.addedAt).map(toDiscRow);
  console.log(`\nNew discs to insert: ${rows.length}`);

  if (rows.length === 0) {
    console.log('\nNothing to do.');
    return;
  }

  report(rows);

  if (isDryRun) {
    console.log('\nRows that would be inserted:');
    rows.forEach((row) => console.log(JSON.stringify(row)));
    console.log('\nDry run — nothing was written.');
    return;
  }

  console.log('');
  await insertRows(rows);
  console.log('\nDone.');
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
