"use client";
import { FormEvent, useState } from "react";
import { CalendarDays, Check, Clock3, MapPin, Users } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

const packageOptions=[{label:"Quick Meet — 2 hours",price:150},{label:"Business Session — 3 hours",price:225},{label:"Workshop — 4 hours",price:350},{label:"Social Gathering — 4 hours",price:395},{label:"Celebration — 4 hours",price:495},{label:"Half Day — 6 hours",price:595},{label:"Full Day — 10 hours",price:895}];
const addOnGroups=[
  {title:"Setup & time",items:[{label:"Early decorating time — 1 hour",price:50},{label:"Additional event hour",price:100},{label:"Celebration additional hour",price:125},{label:"Custom room configuration",price:75},{label:"Extended cleanup",price:75}]},
  {title:"Hospitality",items:[{label:"Coffee service",price:35},{label:"Beverage station",price:45},{label:"Catering coordination",price:50}]},
  {title:"Event equipment",items:[{label:"Microphone",price:25},{label:"Speaker system",price:50},{label:"Podium",price:25},{label:"Whiteboard or easel",price:15}]},
  {title:"Celebration",items:[{label:"Table linens — starting rate",price:8},{label:"Cocktail table — one",price:20},{label:"Backdrop",price:75},{label:"Event signage",price:35},{label:"Décor coordination",price:100}]},
  {title:"Content creation",items:[{label:"Backdrop stand",price:40},{label:"Ring lights",price:25},{label:"Content lighting",price:50},{label:"Photography setup",price:75}]},
  {title:"Staffing",items:[{label:"Event attendant — 1 hour",price:35},{label:"Setup assistance — 1 hour",price:40},{label:"Additional post-event cleaning",price:75}]},
];

export default function BookPage(){
  const [sent,setSent]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [submitError,setSubmitError]=useState("");
  const [purpose,setPurpose]=useState("Meet");
  const [selectedPackage,setSelectedPackage]=useState("");
  const [selectedAddOns,setSelectedAddOns]=useState<string[]>([]);
  const packagePrice=packageOptions.find(item=>item.label===selectedPackage)?.price||0;
  const addOnPrice=addOnGroups.flatMap(group=>group.items).filter(item=>selectedAddOns.includes(item.label)).reduce((sum,item)=>sum+item.price,0);
  const estimatedTotal=packagePrice+50+addOnPrice;
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    const data=new FormData(event.currentTarget);
    data.delete("purpose");
    data.set("Purpose",purpose);
    data.set("Required cleaning fee","$50");
    data.set("Estimated total",`$${estimatedTotal}`);
    data.set("Optional enhancements",data.getAll("addons").join(", ")||"None selected");
    data.set("_replyto",String(data.get("email")||""));
    data.set("_subject","New Social Nest rental slot request");
    data.set("_template","table");
    data.set("_captcha","false");
    data.set("_url","https://social-nest.com/book");
    data.delete("addons");
    fetch("/api/inquiries",{method:"POST",body:data}).catch(()=>{});
    try{
      const response=await fetch("https://formsubmit.co/ajax/info@social-nest.com",{
        method:"POST",
        headers:{Accept:"application/json"},
        body:data,
      });
      const result=await response.json().catch(()=>null);
      if(!response.ok||result?.success===false) throw new Error("Submission failed");
      setSent(true);
      window.scrollTo({top:0,behavior:"smooth"});
    }catch{
      setSubmitError("We couldn’t send your request. Please try again or email info@social-nest.com.");
    }finally{
      setSubmitting(false);
    }
  };
  return <main><SiteHeader />
    <section className="booking-hero"><div><p className="eyebrow">Request a rental slot</p><h1>Choose a time for your gathering.</h1><p>Request your preferred event date and time online. Social Nest will review availability and contact you before any booking or payment is finalized.</p></div><div className="booking-promise"><p><MapPin/>10301 Democracy Ln, Unit 413, Fairfax, VA</p><p><CalendarDays/>Choose a preferred and alternate date</p><p><Clock3/>Request your event start and end time</p><p><Users/>Plan for your guest count</p></div></section>
    {sent?<section className="booking-success"><span><Check/></span><p className="eyebrow">Request received</p><h2>Your inquiry has been sent.</h2><p>Social Nest will review your gathering details and follow up using the contact information you provided. Your date is not reserved until availability, pricing, terms, and payment are confirmed.</p><button className="button" onClick={()=>setSent(false)}>Send another request</button></section>:
    <section className="booking-layout"><aside><p className="eyebrow">How it works</p><ol><li><b>01</b>Choose your purpose</li><li><b>02</b>Select a package</li><li><b>03</b>Share date and guest count</li><li><b>04</b>Add useful extras</li><li><b>05</b>Review event details</li></ol><small>Final availability, policies, deposits, and payment are confirmed before your reservation is complete.</small></aside>
      <form className="booking-form" onSubmit={submit}><fieldset><legend><span>01</span>What are you gathering for?</legend><div className="choice-row">{["Meet","Learn","Connect","Celebrate","Create"].map(item=><label key={item} className={purpose===item?"selected":""}><input type="radio" name="purpose" value={item} checked={purpose===item} onChange={()=>setPurpose(item)}/>{item}</label>)}</div></fieldset>
        <fieldset><legend><span>02</span>Choose a package</legend><label className="field-label">Package<select name="package" required value={selectedPackage} onChange={event=>setSelectedPackage(event.target.value)}><option value="" disabled>Select a package</option>{packageOptions.map(item=><option key={item.label} value={item.label}>{item.label} · ${item.price}</option>)}</select></label><p className="required-fee booking-fee">A required $50 cleaning fee is added to every booking.</p></fieldset>
        <fieldset><legend><span>03</span>Request your event slot</legend><div className="field-grid"><label className="field-label">Preferred date<input name="preferredDate" type="date" required/></label><label className="field-label">Preferred start time<input name="preferredStartTime" type="time" required/></label><label className="field-label">Preferred end time<input name="preferredEndTime" type="time" required/></label></div><div className="field-grid"><label className="field-label">Alternate date<input name="alternateDate" type="date"/></label><label className="field-label">Alternate start time<input name="alternateStartTime" type="time"/></label><label className="field-label">Estimated guest count<input name="guestCount" type="number" min="1" placeholder="e.g. 24" required/></label></div><label className="terms-check"><input type="checkbox" name="dateFlexible"/><span className="terms-copy">My date or time is flexible.</span></label></fieldset>
        <fieldset><legend><span>04</span>Optional enhancements</legend><p className="enhancement-note">Select any extras you would like included in your estimate. Items marked by unit or hour are shown at one unit.</p><div className="enhancement-groups">{addOnGroups.map(group=><section key={group.title} className="enhancement-group"><h3>{group.title}</h3><div className="checkbox-grid">{group.items.map(item=><label key={item.label}><input type="checkbox" name="addons" value={`${item.label} — $${item.price}`} checked={selectedAddOns.includes(item.label)} onChange={event=>setSelectedAddOns(current=>event.target.checked?[...current,item.label]:current.filter(value=>value!==item.label))}/><span><Check size={14}/></span><span className="addon-copy">{item.label}<b>${item.price}</b></span></label>)}</div></section>)}</div></fieldset>
        <fieldset><legend><span>05</span>Tell us about your event</legend><div className="field-grid"><label className="field-label">Name<input name="name" type="text" autoComplete="name" required/></label><label className="field-label">Email<input name="email" type="email" autoComplete="email" required/></label><label className="field-label">Phone<input name="phone" type="tel" autoComplete="tel" required/></label></div><label className="field-label">Organization or event name<input name="organization" type="text" placeholder="Optional"/></label><label className="field-label">Event details<textarea name="details" rows={5} placeholder="What are you planning? Include layout, equipment, décor, accessibility, or timing needs." required/></label><div className="booking-acknowledgments"><label className="terms-check"><input type="checkbox" required/><span className="terms-copy">I understand this is a planning request, not a confirmed reservation.</span></label><label className="terms-check"><input type="checkbox" required/><span className="terms-copy">I have reviewed the <a href="/policies" target="_blank">rental and payment policies</a>, including the cancellation schedule and required cleaning fee.</span></label><label className="terms-check"><input type="checkbox" required/><span className="terms-copy">I understand the <a href="/privacy" target="_blank">privacy and website disclosures</a> and consent to Social Nest using my information to respond to this inquiry.</span></label></div></fieldset>
        <section className="pricing-summary" aria-live="polite"><p className="eyebrow">Estimated total</p><div><span>Package</span><b>${packagePrice}</b></div><div><span>Required cleaning fee</span><b>$50</b></div><div><span>Selected enhancements</span><b>${addOnPrice}</b></div><strong><span>Estimated booking total</span><b>${estimatedTotal}</b></strong><small>Estimate uses starting rates and one unit or hour where noted. Taxes, deposits, quantities, overtime, and event-specific requirements are confirmed in the final quote.</small></section>
        <p className="email-submit-note">Your request and pricing selections will be sent securely to <strong>info@social-nest.com</strong>. You won’t need to open an email app.</p>
        {submitError&&<p role="alert" className="email-submit-note">{submitError}</p>}
        <button className="button submit-button" type="submit" disabled={submitting}>{submitting?"Sending request…":"Request this rental slot"}</button>
      </form></section>}
    <SiteFooter /></main>
}
