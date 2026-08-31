# Support for adding multiple discs through website

Before implementing a single piece of code, readh through this prompt and verify that my thesis is doable
without using an external agetic api (OpenAI etc). If ultracode, Fable or some other improved model/technique would
help, suggest what and why.

Also before implementing anything, I'd like to read a plan on how you intend to go on.

## Current problems and sugegsted solutions

Currently new discs can only be added by first inserting them into a google sheet and then running
and import script, that fetches new rows from the sheet into database.

Below are some data that I need to fill in when adding a new disc:

- disc name (and plastic) of Disc ("Mako3, Star", "FD, C-Line", "Undertaker, Titanium") where names
  are Mako3, FD and Undertaker and plastics are Star, C-Line and Titanium
- owner name
- owner phonenumber
- disc color
- club

So far it has worked, but I'd like to investigate how much work it would take to make it possible
to add 1 or more discs through the same web app that lists the discs.

Top priority is to make it easy and quick to add multiple discs. Currently I add new discs by inserting data
in a google sheet document, which is then read by my system: it fetches all new unsynced rows and stores them
into a database. Each row has a row id that is used for determining, if the row has been synced or not.
The sync id is just a numeric value that increases by 1 each new row (I usually generate the row ids by
selecting a few existing values and then pulling down so that google maps generates them for me)

One thing that slows down entering the data is that I have to manually type in the name of the manufacturer,
name of the disc, plastic type and colour.

My initial thought is to build a database of manufacturers and what discs and plastics they have and also a list
colours I often use.

The "New disc form" would have 1 textfield that I can type in texts like:

- "Star Destroyer punainen 050 123 4567 Steve D."
- "Mako3 keltainen"
- "S-Line DD3 pinkki Peter D."

The system would analyze the content and try to identify, which parts describe the disc, the plastic, the weight,
phone number and the owner's name. For example if it finds several numbers separated by single spaces, it should
assume certain range is a phone number. Certain parts it would just have to check against a set of manufacturers,
plastics, disc names.

I don't want to use any external AI api such as Open AI. I expect a simpler system oif regex and quick lookups
should work too. We are talking about quite standardized content.

Before starting work with implementing a UI, setup a unit test environment (suggest suitable libraries), create
tests using "red green refactor" methodology to build and test my thesis.

Check directory (another disc golf related project) "/Users/janimattiellonen/Documents/Development/Frisbeegolf/DiscsForSale/data".
It has a somewhat comprehensive database of discs and manufacturers.

From the same project, you can find "app/features/discs/discColors.ts" that contains commonly used colours.

Below you can find more examples text that you can expect the admin user to enter in the textfield:

- "Opto Ballista punainen Pekka P."
- "Gold Stiletto kellertävä, Liisa"
- "VIP King ruskea 050 111 9876"

You can actually probably generate your own search texts. Some hints:

- plastic may be omitted
- disc name may be omitted
- phone number may be omitted
- owner name may be omitted
- phone number may be in international form: +372 444 3333 (estonian number)
- phone number may be written without spaces (0501112345, +372504442222)
- some plastics may consist of more than one word (K1 Line, Active Premium)
- some colours, manufacturers etc may not be found in the database
- sometimes I may write "Tuntematon Innovan draiveri" which would point at an unknown driver made by Innova

Start with the low hanging fruits and leave the hardest in the end. Analyze my example search texts to figure out, which
are easy and which are not. Prioritise them by how easy they most likely are to implement. During the first
implementation round, stick with the very low hanging fruits.

Run the unit tests and report back on your findings.

## Phase 2 - UI prototype

Next up, let's create a simple UI prototype that I can use to test identification of entered text.

A simple UI with two components:

- text field for entering disc data
- a table component that displays the parsed and identified data

When I enter some text and press the Enter key, the identification process begins

The table component contains columns with headers:

- disc name, plastic, colour, manufacturer, phone number, owner name

At this point, nothing in the table component is editable. Nothing is persisted over the network. Data, or parts of
the data is only added to the table. Columns may be left empty, if no value for a given attribute was identified.

I can manually reset the page by reloading it, so no reset button is needed.

As no data is sent over the network, no login check is required. Use the route "/demo" for this prototype.

## Phase 3 - editable data

I usually enter details of several discs in a row, sometimes up to 30 discs.
The prototype allows me to fill in quite quickly. Sometimes I do make mistakes. THus, I need to be able to
quickly fix errors.

I want to be able to just click on a specific cell in the table to edit that specific data.
When I have added all discs and certain that the entered data is correct, I'll submit the data, which
will then be persisted.

In this phase, let's implement an in-place editor that replaces the static text with a text field containing the
text. When I'm satisfied I'll press the Enter key, which triggers an in-memory save (no persisting over network
at this point). The static text is then replaced with the changes I may have made in the text field.

This phase requires an in-memory data structure that holds the data displayed in the table.

## Phase 4 - allow removing a row

Add a delete icon after each row. If pressed, ask for confirmation. If given, remove the row.

## Phase 5 - persistence prototype

No actual api calls yet. Just about everything else. I want to see what the "interface" looks like.
Include error handling, displaying of error messages and success messages.
Add a submit button that sends data over to the server side. Replace button text with "Lähettää..."
during sending. Show a success box when data is successfully persisted. In this phase assume data is successfully
persisted.

## Phase 6 - real persistence

Next up, let's implement disc persistence. I just added a new column to discs: `external_id` (uuid). THis must be
generated and persisted manually.

Note that club id must also be provided so that we can display correct discs on a public list.

## Phase 7 - deleting disc

I want to be able to delete selected discs. I won't use this often but at times I may need to. Add a server-side
function for deleting a disc.

On the frontpage I have a table listing all the discs. When I'm signed in, an icon is shown in the phone column
that allows me to send a message to the owner. In similar fashion, add a delete icon. When clicked, display an
alert asking if I want to delete disc X. Call the server-side delete function if I confirm. Refresh the table
content without page reload to remove the deleted disc. Use the external_id as disc id.

## Phase 8 - marking disc as returned

The discs table has a column `is_returned_to_owner`. I need a new admin tool to the table that allows me to mark
a disc as returned to the owner. Currently I add a manual entry to the google sheet:

- "29.8.2026 (Janimatti), postitettu"
- "28.8.2026 (Janimatti), noudettu"

It records the date the disc was returned, who returned and basically whether the disc was sent by mail or the
owner fetched it in person.

Previously there was another person besides me who handled the list so that's why a name is included in the
message. Now I only handle these but the message format stuck.

I want to record explicitly how the disc was returned (`return_method`, tinyint, nullable), using a dedicated column
in `clubs` table. We can use numerical representatio: (0: BY_MAIL, 1: PICKED_UP, .... ).
I also need a new column for the date of return (`returned_to_owner_date`, nullable). I no longer need to record
the name of the "handler".

The new admin tool icon should present me with a modal or an inline form with the fields:

- date field
  - returned_to_owner_date
  - current date filled in by default
- radio button
  - return_method
  - options (should be able to be reset)
    - Postitettu
    - Noudettu
- Submit and Cancel buttons.

## Phase 9 - marking disc for sale or donation

The discs table contains columns `can_be_sold_or_donated_text` and `can_be_sold_or_donated_date`.

In a similar fashion as in phase 8, I need a new admin tool that I can mark a disc for sale or donation. An
inline form with the fields:

- date field
  - can_be_sold_or_donated_date
  - current date filled in by default
- radio button
  - can_be_sold_or_donated_method
  - options (should be able to reset)
    - Myydään
    - Lahjoitetaan

## Phase 10 - rename route

Currently /demo is the route for adding new discs. Let's rename it to /discs/add. Also rename the files
and components if needed.

Make sure the route is protected and requires login.

## Phase 11 - allow additional information

Create a new branch.

The `discs` table contains `additional_info` column that can be used for storing private and misc info
that can be found on the disc (PDG number, weight, stamp colour etc).

I want to be able to provide such information using the same textfield.

All text in the textfield followed by a '|' is 5o be identified as content to be stored in
`additional_info`. Note that `additional_info` is never shown for unsigned people and must never be
returned by the query and the response.

For autheticated users, display a (i) icon in the admin tools columns, which open an inline row with the contents of
`additional_info`. If the row contains no data for `additional_info`, then disable the (i) icon.

This requirement forces the other the admin tool icons to have a different color, as the current gray
color might be suitable to indicate a disabled icon.

Remember to edit the query and the response that are used for authenticated users to include
`additional_info`.
