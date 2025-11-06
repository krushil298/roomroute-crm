// Seed template data for RoomRoute CRM
// This file contains professional starter templates for contracts and emails

export const lnrContractTemplate = `Parties
This Local Negotiated Rate Agreement (the "Agreement") is made between {{hotel_legal_name}} d/b/a {{hotel_brand_name}}, located at {{hotel_full_address}} (the "Hotel"), and {{company_legal_name}}, located at {{company_full_address}} (the "Company").

Term

Effective Date: {{effective_date}}

Expiration Date: {{expiration_date}}

Renewal: Parties may renew by written agreement prior to expiration. If not renewed, this Agreement expires on the Expiration Date.

Rate Program

Room Types & Rates (net, non-commissionable unless stated):

[ROOM TYPE A] – $[RATE] [Weekday/Weekend or All Days]

[ROOM TYPE B] – $[RATE]

Last Room Availability (LRA): [Yes/No] (If "Yes," rates apply when the specified room type is available for sale. If "No," rates are subject to blackout periods or inventory controls at Hotel's discretion.)

Blackout Dates: [List dates or "None"]

Rate Basis: [Fixed $ / % off BAR / Best Available Rate / Seasonality grid]

Taxes & Fees: Rates are [exclusive/inclusive] of applicable taxes, assessments, and fees.

Commission: [Yes/No, % if applicable]

Booking & Identification

Booking Method(s): [GDS chain code / direct / brand.com / corporate portal]

Rate Code(s): [e.g., LNR / CORP / Company Code]

Company Identification: Guests must request the {{company_name}} rate and provide [ID/Email/Business Card] upon check-in if requested.

Services & Concessions

Inclusions (circle or edit): Wi‑Fi / Parking / Breakfast / Laundry / Shuttle / Fitness / Meeting Room Discount.

Direct Bill: [Yes/No] (If Yes, see Billing terms below.)

Amenity Variances: Included services may change with notice if brand standards or local regulations require.

Billing, Payment & Credit

Method: [Guest pays own / Direct bill / Credit card on file].

If Direct Bill: Company must complete credit application; Hotel may set a credit limit and suspend direct billing upon delinquency.

Payment Terms: [Net 15/30] days from invoice date. Late amounts may incur a finance charge permitted by law.

Tax-Exempt: Provide valid documentation prior to check-in; otherwise taxes apply.

Incidentals: Individual guests are responsible unless otherwise stated.

Cancellations & No-Shows

Unless otherwise noted on the reservation confirmation, cancellations must be made [by X:00 p.m. local time, X days prior / 24–48 hours prior] to avoid a charge of [one night room & tax]. No-shows are charged [one night room & tax].

Confidentiality
Rates, codes, and terms are confidential and may not be published or shared with third parties (including OTAs) without Hotel's written consent.

Compliance
Parties will comply with applicable laws (including anti-bribery and trade sanctions). Each party is responsible for its own employees and contractors. Hotel will handle any guest personal data in accordance with its privacy policy and applicable law.

Indemnification & Liability
Each party indemnifies the other against third‑party claims arising from its negligence or willful misconduct. Hotel's liability to Company is limited to proven direct damages and will not exceed the amounts paid by Company under this Agreement in the [12] months preceding the claim; no indirect or consequential damages.

Force Majeure
Neither party is liable for failure or delay caused by events beyond reasonable control (e.g., natural disasters, government action, labor disputes, utility failures). Affected party will notify the other and use reasonable efforts to mitigate.

Termination

For Cause: Either party may terminate for material breach if not cured within [10] business days after written notice.

For Convenience: Either party may terminate with [30] days' written notice; reservations made before the termination effective date will be honored at the agreed rate.

Governing Law & Venue
This Agreement is governed by the laws of [STATE]; exclusive venue in [COUNTY, STATE] courts.

Entire Agreement; Amendments; Notices
This is the entire agreement regarding its subject matter and supersedes prior proposals. Amendments must be in writing and signed by both parties. Notices are effective when sent to the contacts below:

Hotel Notices: {{hotel_contact_name}} / [Title] / {{hotel_contact_email}} / {{hotel_full_address}}

Company Notices: {{full_name}} / [Title] / {{contact_email}} / {{company_full_address}}

Signatures
Hotel: {{hotel_legal_name}}
By: ________________________ Name/Title: __________________ Date: ________

Company: {{company_legal_name}}
By: ________________________ Name/Title: __________________ Date: ________`;

export const groupSalesTemplate = `Parties & Event
This Group Sales Agreement (the "Agreement") is between {{hotel_legal_name}} d/b/a {{hotel_name}} (the "Hotel") and {{company_legal_name}} (the "Group") for the {{event_name}} taking place {{event_dates}} in {{hotel_city}}, {{hotel_state}}.

Room Block & Rates

Date    Room Type       Rooms (Block)   Rate (USD)      Notes
[MM/DD] [King/Two Queen]        [#]     $[Rate] [e.g., includes Wi‑Fi/parking]
[MM/DD] [King/Two Queen]        [#]     $[Rate] 

Total Blocked Rooms: [#]

Cut‑Off Date: {{cut_off_date}} (rooms not reserved by this date are released to general inventory).

Rate Basis: [Net or Commissionable %]; rates [exclusive/inclusive] of taxes/fees.

Additional Guests: [$] per person per night after [2] adults (if applicable).

Concessions (if any)

[e.g., 1 per 40 comp; discounted meeting room; late checkout; bus parking]

Reservations & Rooming List

Method: [Call-in / Group Code / Link / Rooming List].

Rooming List Due: [MM/DD/YYYY] by [Time] local.

Individual Payment Method: [Guest own / Master].

Name changes allowed until [X] days prior to arrival.

Deposits & Payment

Deposit Schedule: [e.g., $[Amount] due at signing; 50% of estimated room revenue by MM/DD; balance at check‑in/check‑out].

Credit Card Authorization / Direct Bill terms apply if approved.

Late balances may incur a finance charge permitted by law.

Attrition
Group agrees to achieve at least [80–90]% of the Total Blocked Rooms. If actual pick‑up is less, Group will pay [the difference in room revenue at the Group Rate] as liquidated damages, less rooms the Hotel is able to resell over the same dates (resell credit applies).

Cancellation
If Group cancels after signing, liquidated damages are due based on the date of written notice:

>90 days prior to arrival: [No penalty / X% of total room revenue]

60–89 days: [25%]

31–59 days: [50%]

0–30 days: [80–100%]
(Resell credit will reduce damages for rooms the Hotel resells over the same dates.)

Meeting & Event Space (if applicable)

Space: [Room Name(s) / Sq Ft / Set‑ups]

Rental: [$]

Food & Beverage Minimum: [$] plus applicable taxes and service charge ([__]%).

Banquet Event Orders (BEOs) due [X] days prior. Outside food/beverage [not permitted / permitted with fees].

Policies

Check‑in [Time] / Check‑out [Time]; early arrivals and late departures subject to availability and fees.

Smoking, noise, pet, and conduct policies per Hotel standards. Damages or excessive cleaning will be charged to [Master/Individual].

Compliance, Insurance & Indemnity

Group will comply with laws and hotel rules. If required, Group provides a certificate of insurance naming Hotel as additional insured with limits of [$1M each occurrence / $2M aggregate].

Each party indemnifies the other for claims arising from its negligence or willful misconduct.

Force Majeure
Performance is excused to the extent prevented by events beyond reasonable control (e.g., acts of God, government action, declared emergencies). Affected party will notify and mitigate.

Governing Law & Venue
This Agreement is governed by the laws of [STATE]; venue in [COUNTY, STATE] courts.

Entire Agreement; Amendments; Notices
This Agreement is the entire understanding. Changes must be in a signed writing. Notices:

Hotel: {{hotel_contact_name}}/[Title]/{{hotel_contact_email}}/{{hotel_full_address}}

Group: {{full_name}}/[Title]/{{contact_email}}/{{company_full_address}}

Signatures
Hotel: {{hotel_legal_name}}
By: ________________________ Name/Title: __________________ Date: ________

Group: {{company_legal_name}}
By: ________________________ Name/Title: __________________ Date: ________`;

export const iceBreakerEmailTemplate = `Hi {{first_name}},

I hope this email finds you well. 

I'm {{your_name}} with {{hotel_name}} in {{hotel_city}}. We host [your type of travelers — e.g., project crews / visiting nurses / vendor teams] for [Company/Facility] nearby. Groups like yours appreciate our spacious rooms, 24-hour fitness center, and an award winning guest loyalty program.

If you ever need a simple, consistent setup (direct bill or corporate rate), I can get you a one‑page rate and hotel fact sheet over and hold space when you're in a pinch.

Would it be helpful if I send a quick one‑pager and a couple of date options for a 10‑minute call?

Thanks,
{{your_name}}
{{your_title}} | {{hotel_name}}
{{your_mobile}} | {{your_email}}`;

export const followUpEmailTemplate = `Hi {{first_name}},

I really enjoyed connecting with you on [date]. Just wanted to do a quick check-in on the [LNR/Group] we discussed for {{company_name}}.

Do you have any follow-up questions for me at this time, or would you like to schedule an onsite visit to see our property in person?

At {{hotel_name}}, we're all about comfort, flexibility, and creating exceptional experiences for our guests. Please let me know where we stand, and I'm happy to offer several options for you to consider. 

Thanks,
{{your_name}}
{{your_title}} | {{hotel_name}}
{{your_mobile}} | {{your_email}}`;

export interface SeedTemplate {
  name: string;
  type: string;
  description: string;
  content: string;
  subject?: string; // For email templates
}

export const SEED_CONTRACT_TEMPLATES: SeedTemplate[] = [
  {
    name: "Standard LNR Agreement",
    type: "lnr",
    description: "Professional Local Negotiated Rate contract template with complete terms and conditions for corporate accounts",
    content: lnrContractTemplate,
  },
  {
    name: "Group Sales Agreement",
    type: "group",
    description: "Comprehensive group booking contract template including room blocks, attrition clauses, and meeting space terms",
    content: groupSalesTemplate,
  },
];

export const SEED_EMAIL_TEMPLATES: SeedTemplate[] = [
  {
    name: "Ice Breaker - Initial Outreach",
    type: "email",
    description: "Warm introduction email to establish contact with potential corporate or group clients",
    content: iceBreakerEmailTemplate,
    subject: "Quick introduction from {{hotel_name}}",
  },
  {
    name: "Follow-up After Meeting",
    type: "email",
    description: "Professional follow-up email to maintain momentum after initial discussion",
    content: followUpEmailTemplate,
    subject: "Following up on our conversation",
  },
];
