# Custom message templates

Currently I can create custom message templates tha tar available when I want to send an sms to a disc's 
owner from the frontpage.

I'd like to be able to send an sms to an owner from route /responses. However in this case I want to use 
a different type of message. In this case I don't necessarily want to see all existing message templates
that are available (for example those that relate to a disc been found in course X or a disc that has been
with the club for a long time). We need a way to add a category or similar to each message template so that
I can decide, what message templates are available depending on the use case.


I'd like to be able to manage the available categories myself using an admin tool. Therefore the category
names should be in an own table referenced when needed. Any use of certain category must survive category
rename and deletion (must be allowed to have a message template with no category).

The message template admin tool should allow me to select or deselect a category for each message template.

Where in code I use the message templates, will be defined in code.
