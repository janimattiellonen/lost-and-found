# Puskasoturit

I'm planning on using this same project for another club, Puskasoturit (CLUB_ID = 1).

Create a new branch.

First task it see wht there is no logo visible on the frontpage.

If CLUB_ID = 2 then image tt-sini-logo.jpg is used. For CLUB_DI = 2, image ps-logo.png should be used

## Multiple courses

Puskasoturit ry gets lost discs from two courses, Oittaa and Äijänpelto. There should be a course filter
(radio buttons + reset option) that allows the user to select the course from which to list found discs.

Also see functions in `app/models/syncDiscs.server.ts` that persists new discs.

Note that some of the functions in `app/models/syncDiscs.server.ts` deletes rows from `discs`.

In this case don't want to delete anything, just add data that has not yet been added and that some data
is added to the new columns, if possible. Hint: use the internal_disc_id value to verify that the disc
has not been previously persisted to database. Note that internal_disc_id is not unique on its own, you
need to use club_id along. Same internal_disc_id can be found twice, one with club_id 1 and one with club_id 2.

Create a separate script that fetches the data (maybe using PuskasoturitImporter), formats the data to
fit the new `discs` columns and persists the data to Supabase. The script must have a dry run flag that
displays the data to be saved, without actually trying to save.

This script should be runnable using `npm run ...`.

## Fixes to new disc form

- use radio buttons instead of select list for course
- the course is not a value that I enter in the text field. It should be obtained only form the filter
  selection
- I often add several discs for either Äijänpelto or Oittaa. If I fail to select a course when I add new
  discs, show a subtle notice to remind me to choose a course
- make it possible for me to select course for all discs added by the textfield, that are not yet
  persisted in one click
