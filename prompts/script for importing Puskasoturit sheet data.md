# Script for importing Puskasoturit sheet data

While I'm actually abandoning the old way of importing disc data from a google sheet, I want to make a 
final import from the Puskasoturit google sheet, which hasn't been done in a long time.

I want to have the data for statistical purposes.

Previously used script can be found in `app/import/PuskaSoturitImporter.ts`.

The `discs` table has new columns for determining whether disc was sold and donated, was the disc returned
by mail of pickup. The data in the google sheet is handled in a different way that will need some parsing.

For example a disc that was returned to its owner, has often these notes:
- "18.8.2026 (Janimatti), noudettu"
- 15.8.2026 (Janimatti), postitettu
- 26.8.2026 (Janimatti), kaveri nouti
- Viety Taliin

Format of these notes: (date of return, name handler [who returned], mail or pickup)

If a disc was sold or donated:
- "Lahjoitetaan"
- "Myydään"

Format: donated or sold.

As these are not always standardized and we don't have the date when a disc was marked for donation or,
for sale, we have to parse and at times just leave some of the columns empty.




