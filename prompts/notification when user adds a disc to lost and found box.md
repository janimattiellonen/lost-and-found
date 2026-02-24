# Notification when user adds a disc to lost and found box

When a user has found a disc and drops it into a lost and found box, the user can 
send a notification that one or more discs have been found.

This could be useful on courses where I don't go as often to check for new discs.
A notification lets me know there is a new disc.

## Basic concept

A new page, where the user may send a notification with as little effort as simply
pressing a button. Optionally the user may leave his contact details and a short 
message for submitting brief details about the found disc. The contact details
may be filled for letting the owner know, who found the disc etc.

## Technical details



- route file: suggest a route for the page



## Row Level Security (RLS)

I'm not sure how to configure supabase RLS and policies. 

What I want:
- anyone visiting /notify should be able to cause a new row to be added to the disc_found_notifications
  table in supabase.
- only a signed in person (me) can visit the /notifications page and see the rows found in the 
  disc_found_notifications table


## Date format and ordering

On the /notifications page, I'd like to see the time of notification too



## Removing notifications

Add a delete button for each notification. When pressed, show a basic confirmation that asks whether I 
want to delete the notification or not.


## Providing the course name

Case 1:

If the user later on remembers that he found a disc, he may visit /notify and select, which course he
found the disc on. In this case a "Select course" select list is visible (user does not need to click the
"Lisää yhteystiedot tai viesti (valinnainen)" button to see this select list).




Case 2:

I want to be able to print a poster that has the title "Did you find a disc?". Below the title
is a big QR code. If the user takes a picture of it, he can then open the /notify page with a specific
course preselected. The name of the course is visible. If the user then submits either by just clicking the
button or also filling the form, the course name is provided automatically during form submission.

The name of the course is added to the route:

/notify/:course-slug

In this case, the "Select course" select list is not visible at all. The user may not change the course.

At this point, ignore the QR code part. This will be implemented later. Now we need to make it possible
to manually visit the /notify/:course-slug route.


### Available courses

Here are all the available courses. Each item consists of a slug and the actual course name. The slug
is only for the route. Course name is visible for the user. The course name value is to be stored
in the table upon submission.

tali | Talin frisbeegolfpuisto
oittaa | Oittaan frisbeegolfrata
aijanpelto | Äijänpelto frisbeegolf

These can be hard coded.

Routes would look like:

/notify/tali
/notify/oittaa
/notify/aijanpelto


### QR codes

Enter plan mode.

Next, I need a way to generate a poster containing a title and QR code pointing to a specific course.

Suggest a npm package that can be used for generating QR codes. 

Use /notifications page for displaying buttons that triggers generation of QR code. Create a button panel 
above the notifications list. One button for each course. Each button is to be named like 
"QR: [course name]".

Upon pressing a selected QR button, generate a pdf file using @react-pdf/renderer that contains the title
and the QR code. Download the generated pdf file. If possible, name the pdf file "[course-name]-qr.pdf".

The title should be "Löysitkö kiekon?"

### Fixes

When I visit http://localhost:3400/notify/tali I can still see the radio buttons. 
The radio buttons (along with course selection validation) should not be in use. The course selection
should only be visible if I visit "/notify"


## PDF improvements
- show url below the QR code
- show the image public/TT-Logo-transparent.png centered above the QR code

Add a greeting at the bottom:

"Kiitos!

[clubName]"


## Visual improvements to /notify page
- when on /notify page, show the menu, logo (/tt-sini-logo.jpg) and the title 
 "Löytökiekot - Talin Tallaajat" only if the user is logged in
- style the /notify page to look better. The idea with this page is to be shown on mobile devices