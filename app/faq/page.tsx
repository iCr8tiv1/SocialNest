import type { Metadata } from "next";
import { PageCta, PageHero, SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "FAQ | Social Nest", description: "Answers about Social Nest bookings, setup, availability, packages, and policies." };
const faqs=[
  ["What kinds of events work at Social Nest?","Meetings, workshops, classes, networking events, community gatherings, showers, birthdays, photography, video, and other private events that fit the space and rental guidelines."],
  ["What is the minimum reservation?","The working minimum is two hours. Quick Meet is the shortest package, with longer packages available for workshops, celebrations, retreats, and productions."],
  ["Can I decorate the space?","Yes. Social Nest is intentionally neutral so you can personalize it. Setup and decorating time should be reserved separately from event time."],
  ["What is included in a rental?","Core amenities include Wi-Fi, flexible tables and chairs, climate control, 200+ free parking spaces, an equipped breakroom, a public restroom outside the unit, elevator access, and access to the presentation display. Final inclusions are confirmed with your booking."],
  ["How many guests can the space accommodate?","Social Nest currently uses a conservative planning cap of up to 49 guests. The final approved count depends on the event layout and may never exceed the building’s Certificate of Occupancy, posted occupant load, egress limits, or direction from City and fire officials."],
  ["Can I add extra time?","Yes, when availability allows. Working guidance is $100 per additional event hour and $125 per additional celebration hour."],
  ["Is there a cleaning fee?","Yes. A required $50 cleaning fee is added to every booking. Extended cleanup or additional cleaning support may cost extra when needed."],
  ["Can I bring outside food or vendors?","Catering coordination and preferred vendor relationships are available. Final food, vendor, and insurance requirements are confirmed for each event."],
  ["What are the operating hours?","Typical availability is Monday–Thursday 8 AM–9 PM, Friday 8 AM–10 PM, Saturday 9 AM–10 PM, and Sunday 10 AM–7 PM. Extended hours may be available by request."],
  ["What are the payment and cancellation terms?","A 50% reservation payment is due at signing and the remaining balance is due seven days before the event. Cancellations 30 or more days before receive a refund less a 10% administrative charge; Social Nest retains 50% for cancellations 15–29 days before; and payments are nonrefundable 14 days or fewer before. A refundable $250–$500 security deposit may be required. See the Rental Policies page for the complete terms."],
  ["How far ahead should I inquire?","Send your preferred date as early as you can, especially for evenings and weekends. If your timing is flexible, include an alternate date so we can help you find the best fit."],
  ["Is my date reserved when I submit the form?","No. The form starts the planning conversation. Your reservation is complete only after availability, final pricing, rental terms, and any required payment are confirmed."],
];
export default function FaqPage(){return <main><SiteHeader /><PageHero eyebrow="Frequently asked questions" title="Good gatherings start with clear details." intro="Here’s what to know as you consider your date, package, setup, and event needs." />
  <section className="faq-list">{faqs.map(([question,answer],index)=><details key={question} open={index===0}><summary><span>0{index+1}</span>{question}</summary><p>{answer}</p></details>)}</section><PageCta title="Still wondering about something?" /><SiteFooter /></main>}
