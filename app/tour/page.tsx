"use client";
import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

function calendarDate(value:string){return value.replace(/[-:]/g,"").replace("T","")+"00"}

export default function TourPage(){
  const [date,setDate]=useState("");
  const [time,setTime]=useState("");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const calendarUrl=useMemo(()=>{
    if(!date||!time)return "#";
    const start=new Date(`${date}T${time}:00`);
    const end=new Date(start.getTime()+30*60000);
    const fmt=(value:Date)=>calendarDate(value.toISOString().slice(0,16));
    const params=new URLSearchParams({action:"TEMPLATE",text:"Social Nest Tour Request",dates:`${fmt(start)}/${fmt(end)}`,details:`Tour requested by ${name || "Guest"} (${email || "email not provided"}). This is a request and is not confirmed until Social Nest responds.`,location:"10301 Democracy Ln Unit 413, Fairfax, VA 22030",add:"info@social-nest.com"});
    return `https://calendar.google.com/calendar/render?${params}`;
  },[date,time,name,email]);
  const submit=(event:FormEvent)=>{event.preventDefault();if(calendarUrl!=="#")window.open(calendarUrl,"_blank","noopener,noreferrer")};
  return <main><SiteHeader/><section className="booking-hero"><div><p className="eyebrow">Schedule a tour</p><h1>Come see the Nest.</h1><p>Choose a preferred 30-minute visit. Google Calendar will open with Social Nest added as a guest. Your tour is confirmed only after we accept or reply.</p></div><div className="booking-promise"><p><MapPin/>10301 Democracy Ln, Unit 413, Fairfax, VA</p><p><CalendarDays/>Choose a preferred date</p><p><Clock3/>Allow 30 minutes</p></div></section><section className="tour-section"><form className="tour-form" onSubmit={submit}><label className="field-label">Your name<input value={name} onChange={event=>setName(event.target.value)} required/></label><label className="field-label">Email<input type="email" value={email} onChange={event=>setEmail(event.target.value)} required/></label><div className="field-grid"><label className="field-label">Preferred date<input type="date" value={date} onChange={event=>setDate(event.target.value)} required/></label><label className="field-label">Preferred time<input type="time" value={time} onChange={event=>setTime(event.target.value)} required/></label></div><p className="email-submit-note">This creates a Google Calendar invitation with <strong>info@social-nest.com</strong> as a guest. It does not guarantee availability.</p><button className="button submit-button" type="submit">Open in Google Calendar</button></form></section><SiteFooter/></main>
}
