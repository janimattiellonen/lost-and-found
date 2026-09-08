# Allow user to flag disc

A feature that lets the disc owner easily indicate whether they want the disc back or whether they're
donating it to the club. When the disc owner receives a text message telling them their disc has been
found, they are also given a link to a page where they can easily make their choice.
When the user clicks the link, they are shown the details of that disc and the last four digits of
their phone number.

This feature does not require a login. For security purposes, only show the last 4 digits of the
phonenumber, in case someone gets hold of the link

## Fixes

I made some minor fixes myself to some texts.

If the user answers "Yes" to the question "Haluatko kiekon takaisin?", I would like to see the
"Miten haluat kiekon?" section directly under it. Same, if the suer answers "Yes" to the question
"Postita kiekko minulle". Visually group sections so that it is easy for the user to see, which fields
belongs where.

## Instructions

We need to add some instructions, in case the owner wants his disc to be shipped.

Ohjeet

Maksa Mobilepaylla 6,30€ NUMEROON 050 464 3904 (Janimatti Ellonen).

Vapaaehtoisen vaivanpalkan voit halutessasi maksaa seuralle NUMEROON 80603 (Puskasoturit ry).

Ilmoita tekstiviestitse numeroon 050 464 3904 kun olet maksanut.

Muista antaa koko osoite!

## Club information

### Puskasoturit

Number: 80603
Name: Puskasoturit ry

### Talin Tallaajat

Number: 808226
Name: Talin Tallaajat / Myynti

## In case of problems

Add a note that in case of problems or questions, contact via:

Puskasoturit ry: loytokiekot@puskasoturit.com
Talin Tallaajat: janimatti.ellonen@gmail.com

## In case of pickup

If the user selected "Noudan kiekon – sovitaan noudosta erikseen", show the text

"Kiekon voi noutaa Espoon Lintuvaarasta. Saat pian viestin, jossa tarkemmat ohjeet."

## In case the owner has multiple discs

The user may have more than one disc waiting for him (same phone number on multiple discs).

Shipping costs increase by the amount of discs.

Here is a function taken from another disc golf related project that calculates estimated shipping costs:

```
export function calculateEstimatedShippingCosts(discCount: number): number {
  if (discCount === 1) {
    return 5.9;
  }

  if (discCount < 8) {
    return 9.9;
  }

  return 11.9;
}

```

### Things to solve

What if the owner wants to have back only some of the discs? This happens from time to time. Which
of the discs does the owner want to keep and which does he donate?

If the owner has multiple discs, we need to list them all.

Does the current database structure support for allowing the owner to select, which of his discs he
wants back and which can be donated?
