# Full bin

There is lost and found box for disc golfs on a course that I do not visit as often.
During the season, the lost and found bin might get full and now new discs fit.

In such case it would be good if the user, who tried to add a new disc to the bin, could easily report
that the bin is full

I want to be able to print out a paper with a QR code and a suitable title that the user may take a 
photo with his phone. When the url in the QR code is loaded, the user can click on a button saying
"Bin is full".

Previously we implemented a similar feature where the user could scan a QR code and report that he had 
returned a disc. Check that implementation for a reference. I need a similar download feature for the
pdf file.

## Specs
- route: bin/full/:course-name
  - bin/full/oittaa
  - use puskasoturit logo
  - currently only one course needs this



## Claude

⏺ Plan

1. Route: app/routes/bin.full.$courseSlug.tsx → /bin/full/oittaa
- Puskasoturit logo, Finnish heading ("Löytökiekkolaatikko täynnä?")
- Single "Laatikko on täynnä" button; on submit writes a row and shows "Kiitos ilmoituksesta!"
- Mirrors existing notify.$courseSlug.tsx pattern

2. DB + server model: new bin_full_notifications table (id, created_at, club_id, course_name,
   read_at). New app/models/binFullNotification.server.ts mirroring
   discFoundNotification.server.ts. No contact fields (spec says just a button).

3. PDF poster: new component for the "bin full" variant with Puskasoturit logo and a matching
   title (e.g. "Laatikko täynnä?"). Reuses the QR-generation / download flow from the existing
   QrPosterButtons.tsx.

4. Admin view: add a poster-download button on the existing /notifications page. Reports
   viewable in a small section on that same page (vs. a separate route).

Questions

1. DB migration — you handle Supabase schema yourself? I'll write the SQL but not apply it.
2. Spam / rate-limit — accept that anyone with the QR can click freely, or ignore repeat clicks
   within a short window?
3. View reports — OK to add a section on /notifications, or prefer a separate route?

Your plan is sound.

Answers to questions:

Q1: A proper migration for this new feature would be nice if it's easy to run

Q2: Some kind of "rate limit" could be added yes

Q3: OK