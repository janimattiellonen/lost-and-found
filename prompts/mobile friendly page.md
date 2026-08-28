# Mobile friendly page

I want to experiment with a more mobile friendly ui for checking, if your disc has been found.

Currently the page contains a lot of text in the beginning, a couple of filters and a big table listing the 
discs. This ui works on a laptop or a desktop computer and maybe even on a tablet, but the ui/ux is very poor
on mobile devices; the user must first scroll down the text part, which becomes irrelevant after a few
visits, the filters are also not rendered properly. In addition to these issues, the table is rendered
very poorly and the user must scroll both horizontally and vertically to browse the data.

In reality, seeing the table containing all the discs might not be relevant at all as basically 99% of all
listed discs are not the user's. 

In most cases, if the user's disc contains a phonenumber, he can easilly filter using the last 4 digits 
of the phonenumber to narrow down the list of discs to only a couple of discs (in most cases a user 
has at most 4-5 discs that belongs to him). The phonenumber may have become unreadable and thus entered
incorrectly into the system. In this case using the phonenumber filter would not help. He would have to 
use the disc name filter instead.

## Improvements

Here are some improvements that I can think of. Feel free to come up with more ideas or find issues with my
ideas.

- don't show any discs initially, just a field for disc name or phonenumber
  - if the user enters a value that can be assumed to be a phonenumber, always use the 4 last digits when 
    doing the search
- hide the disc name filter initially but allow the user to use it via a "More filters..." link
- hide the wall of text behind a button
- when displaying search results, skip the currently used table structure. Instead, use a custom 
  result item component that can display teh same data on multiple lines without needing so much 
  horizontal space as the current table component requires


## initial version

Don't touch the current route. Create a new route, "/index2" with a fresh start. The very first version 
can just be a visual ui mock so that we can quickly see if it works or needs more adjustments. 

Create a new branch for this feature.