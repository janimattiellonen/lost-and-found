/**
 * Rewrites every disc's owner phone number into its stored form, once, so the
 * check constraint in specs/16-phone-number-format.md can go on.
 *
 * Run it with:
 *   npm run normalise:phones -- --dry-run
 *   npm run normalise:phones -- --dry-run --verbose
 *   npm run normalise:phones
 *   npm run normalise:phones -- --restore=backups/phone-numbers-<time>.json
 *
 * Flags:
 *   --dry-run        print the report, write nothing
 *   --verbose        also list every number that would be converted, old → new
 *   --restore=<file> write back the old values a real run saved in <file>
 *
 * Every club's discs, not one club's: the constraint covers the whole table.
 *
 * A number the rule cannot read is left exactly as it is and listed, to be
 * fixed by hand on the edit page; rerun until none are left. A real run writes
 * a backup of every value it changes before it changes any, because local
 * development runs against the production database and there is no other copy
 * to go back to. Only owner_phone_number is written: updated_at means "edited
 * by hand", which this is not.
 *
 * Writing needs more than the anon key; see createWriteConnection.
 *
 * Runs on plain node (>= 22) via its native TypeScript stripping, so nothing in
 * this file's import graph may use the `~/` alias at runtime.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { normalisePhoneNumber } from '../app/phoneNumber.ts';
import { createReadConnection, createWriteConnection } from './supabaseClients.ts';

/** Supabase caps a select at 1000 rows. */
const PAGE_SIZE = 1000;

/** Updates in flight at once. Each row gets its own value, so none can be batched. */
const CONCURRENCY = 10;

const BACKUP_DIRECTORY = 'backups';

type Disc = {
  external_id: string;
  club_id: number;
  disc_name: string;
  owner_phone_number: string | null;
};

/** One value to write: the disc and what its number becomes. */
type Change = { externalId: string; from: string | null; to: string | null };

type Report = {
  alreadyStored: Disc[];
  blank: Disc[];
  converted: { disc: Disc; to: string }[];
  /** Converted as Finnish, but 07 is a Swedish mobile prefix and not a Finnish one. */
  toCheck: { disc: Disc; to: string }[];
  cannotConvert: Disc[];
};

function flag(name: string): string | undefined {
  return process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
}

async function getDiscs(): Promise<Disc[]> {
  const supabase = createReadConnection();
  const discs: Disc[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('discs')
      .select('external_id, club_id, disc_name, owner_phone_number')
      .order('external_id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Reading discs failed: ${error.message}`);
    }

    discs.push(...((data ?? []) as Disc[]));

    if (!data || data.length < PAGE_SIZE) {
      return discs;
    }
  }
}

function classify(discs: Disc[]): Report {
  const report: Report = { alreadyStored: [], blank: [], converted: [], toCheck: [], cannotConvert: [] };

  for (const disc of discs) {
    const raw = disc.owner_phone_number;

    if (raw === null) {
      report.alreadyStored.push(disc);
      continue;
    }

    const result = normalisePhoneNumber(raw);

    if (result.error !== undefined) {
      report.cannotConvert.push(disc);
    } else if (result.phoneNumber === null) {
      report.blank.push(disc);
    } else if (result.phoneNumber === raw) {
      report.alreadyStored.push(disc);
    } else {
      report.converted.push({ disc, to: result.phoneNumber });

      if (raw.trim().replace(/[\s-]/g, '').startsWith('07')) {
        report.toCheck.push({ disc, to: result.phoneNumber });
      }
    }
  }

  return report;
}

function countByClub(discs: Disc[]): string {
  const counts: Record<number, number> = {};

  discs.forEach((disc) => {
    counts[disc.club_id] = (counts[disc.club_id] ?? 0) + 1;
  });

  return Object.entries(counts)
    .map(([club, count]) => `club ${club}: ${count}`)
    .join(', ');
}

function reportLine(disc: Disc, detail: string): string {
  return `  club ${disc.club_id}  /discs/${disc.external_id}/edit  ${disc.disc_name}  ${detail}`;
}

function printReport(report: Report, isVerbose: boolean): void {
  const groups: [string, Disc[]][] = [
    ['Already stored (or no number)', report.alreadyStored],
    ['Blank, set to no number', report.blank],
    ['Converted', report.converted.map(({ disc }) => disc)],
    ['Converted, to check', report.toCheck.map(({ disc }) => disc)],
    ['Cannot convert, left as they are', report.cannotConvert],
  ];

  for (const [label, discs] of groups) {
    console.log(`${label}: ${discs.length}${discs.length > 0 ? ` (${countByClub(discs)})` : ''}`);
  }

  if (isVerbose && report.converted.length > 0) {
    console.log('\nConverted:');
    report.converted.forEach(({ disc, to }) => console.log(reportLine(disc, `"${disc.owner_phone_number}" → ${to}`)));
  }

  if (report.toCheck.length > 0) {
    console.log(
      '\nConverted as Finnish, but starting 07 — a Swedish mobile prefix, not a Finnish one. ' +
        'Retype any Swedish number as +46 on its edit page:',
    );
    report.toCheck.forEach(({ disc, to }) => console.log(reportLine(disc, `"${disc.owner_phone_number}" → ${to}`)));
  }

  if (report.cannotConvert.length > 0) {
    console.log('\nCannot convert. Fix each on its edit page (in the deployment of its club), then rerun:');
    report.cannotConvert.forEach((disc) => console.log(reportLine(disc, `"${disc.owner_phone_number}"`)));
  }
}

/**
 * Writes the changes, CONCURRENCY at a time, and stops after the batch in which
 * a write first fails. The rest of that batch may have landed, so the count it
 * reports is of the writes that did; the backup covers every one either way.
 */
async function apply(changes: Change[], newValue: (change: Change) => string | null): Promise<void> {
  const supabase = await createWriteConnection();
  let written = 0;

  for (let i = 0; i < changes.length; i += CONCURRENCY) {
    const results = await Promise.all(
      changes.slice(i, i + CONCURRENCY).map((change) =>
        supabase
          .from('discs')
          .update({ owner_phone_number: newValue(change) })
          .eq('external_id', change.externalId)
          .select('external_id'),
      ),
    );

    let failure: string | null = null;

    for (const { data, error } of results) {
      if (error) {
        failure ??= error.message;
      } else if (!data || data.length === 0) {
        // Row-level security filters rather than raising: no row back means the
        // write was not allowed.
        failure ??= 'a row was not updated (not signed in as an admin?)';
      } else {
        written += 1;
      }
    }

    if (failure !== null) {
      throw new Error(`Writing stopped with ${written} of ${changes.length} discs written: ${failure}`);
    }

    console.log(`  written ${written}/${changes.length}`);
  }
}

function writeBackup(changes: Change[]): string {
  mkdirSync(BACKUP_DIRECTORY, { recursive: true });

  const path = `${BACKUP_DIRECTORY}/phone-numbers-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

  writeFileSync(path, JSON.stringify(changes, null, 2));

  return path;
}

async function restore(path: string): Promise<void> {
  const changes = JSON.parse(readFileSync(path, 'utf8')) as Change[];

  console.log(`Restoring ${changes.length} phone numbers from ${path}.\n`);
  await apply(changes, (change) => change.from);
  console.log('\nDone. If the check constraint is already on, a restored messy value is refused by it.');
}

async function main(): Promise<void> {
  const restorePath = flag('restore');

  if (restorePath) {
    await restore(restorePath);
    return;
  }

  const isDryRun = process.argv.includes('--dry-run');

  console.log(isDryRun ? 'DRY RUN — nothing will be written.\n' : 'Normalising for real.\n');

  const discs = await getDiscs();

  console.log(`Discs, every club: ${discs.length}\n`);

  const report = classify(discs);

  printReport(report, process.argv.includes('--verbose'));

  const changes: Change[] = [
    ...report.blank.map((disc) => ({ externalId: disc.external_id, from: disc.owner_phone_number, to: null })),
    ...report.converted.map(({ disc, to }) => ({ externalId: disc.external_id, from: disc.owner_phone_number, to })),
  ];

  if (changes.length === 0) {
    console.log('\nNothing to write.');
    return;
  }

  if (isDryRun) {
    console.log(`\nDry run — ${changes.length} changes, nothing was written.`);
    return;
  }

  const backup = writeBackup(changes);

  console.log(`\nBackup of the ${changes.length} old values: ${backup}\n`);
  await apply(changes, (change) => change.to);
  console.log(`\nDone. To undo: npm run normalise:phones -- --restore=${backup}`);
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
