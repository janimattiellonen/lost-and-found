# Sending sms to multiple owners

After I have added several discs, I also need to send sms to them. What I currently do is that I ctrl-click
the comment icon on discs that I want to send the sms to. Then I process each tab one by one.

I wish to have some improvements on this process.

I'd like to be able to select multiple rows from the table and then selecting an action
"Lähetä sms valituille henkilöille". When I do this, a new view is presented, which basically looks like
the current view where I may send a message. The difference is that when I have sent the message to the selected person,
the next person's data is rendered in the view, and so on.

The sms sending view has the following buttons:

- Peru
- Lähetä tekstiviesti
- Merkitse viesti lähetetyksi

The system doesn't actually send the sms itself but creates a template and opens Messages.app on my mac
with phone number and message prepopulated.

Re-use this view with minor modifications:

- if I click the "Peru" button, I just cancel message sending for the specific disc, and next item on the
  list is shown in the form. Same logic if I click the "Merkitse viesti lähetetyksi" button

When all items have been processed, return back to frontpage
