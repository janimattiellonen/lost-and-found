# Support for adding multiple discs through website

Currently new discs can only be added by first inserting them into a google sheet and then running
and import script, that fetches new rows from the sheet into database.

So far it has worked, but I'd like to investigate how much work it would take to make it possible
to add 1 or more discs through the same web app that lists the discs.

Top priority is to make it easy and quick to add multiple discs at once, in a similar way as how a 
google sheet works. That is, not by submitting a form multiple times.

The tool would need to mimic a spreadsheet.

In addition to be able to quickly add multiple discs, I also need a way to modify details of multiple 
discs.

Below are some data that I need to fill in when adding a new disc:
- disc name (and plastic) of Disc ("Mako3, Star", "FD, C-Line", "Undertaker, Titanium") where names
  are Mako3, FD and Undertaker and plastics are Star, C-Line and Titanium
- owner name
- owner phonenumber
- disc color
- club