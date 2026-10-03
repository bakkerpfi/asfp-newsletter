"use client";
import { ChangeEvent, FormEvent, useState } from "react";

type Company={
  id:string;name:string;slug:string;logo_url:string|null;
  primary_colour:string;secondary_colour:string;accent_colour:string|null;
  website_url:string|null;company_address:string|null;
  sender_name:string|null;sender_email:string|null;reply_to_email:string|null;
};

export default function CompanySettingsManager({initialCompany}:{initialCompany:Company}){
  const [company,setCompany]=useState(initialCompany);
  const [saving,setSaving]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [message,setMessage]=useState("");

  function field(key:keyof Company,value:string|null){
    setCompany(c=>({...c,[key]:value}));
  }

  async function save(e:FormEvent){
    e.preventDefault(); setSaving(true); setMessage("");
    try{
      const res=await fetch("/api/company-settings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...company,companySlug:company.slug})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Unable to save.");
      setCompany(data.company); setMessage("Company settings saved.");
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to save.");}
    finally{setSaving(false);}
  }

  async function upload(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file)return;
    if(!file.type.startsWith("image/")){setMessage("Please choose an image file.");return;}
    if(file.size>2*1024*1024){setMessage("Logo must be 2 MB or smaller.");return;}
    setUploading(true);setMessage("");
    try{
      const fd=new FormData();fd.append("companySlug",company.slug);fd.append("logo",file);
      const res=await fetch("/api/company-settings",{method:"POST",body:fd});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Unable to upload logo.");
      field("logo_url",data.logo_url);setMessage("Logo uploaded.");
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to upload logo.");}
    finally{setUploading(false);e.target.value="";}
  }

  const accent=company.accent_colour||company.secondary_colour;

  return <form onSubmit={save} className="mt-8 space-y-8">
    {message&&<div className="rounded-lg border bg-white p-4 text-sm">{message}</div>}

    <section className="rounded-xl bg-white p-8 shadow">
      <h2 className="text-2xl font-bold">Branding</h2>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Company Name</label>
          <input value={company.name} onChange={e=>field("name",e.target.value)} className="mt-2 w-full rounded border p-3"/>
          <label className="mt-6 block text-sm font-semibold">Company Logo</label>
          <div className="mt-2 flex min-h-36 items-center justify-center rounded-lg p-6" style={{backgroundColor:company.primary_colour}}>
            {company.logo_url?<img src={company.logo_url} alt={company.name} className="max-h-24 max-w-full object-contain"/>:<span className="text-xl font-bold text-white">{company.name}</span>}
          </div>
          <label className="mt-4 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-5 transition hover:border-slate-500 hover:bg-slate-100">
  <div className="text-center">
    <div className="font-semibold text-slate-900">
      {uploading
        ? "Uploading Logo..."
        : company.logo_url
        ? "Change Company Logo"
        : "Upload Company Logo"}
    </div>

    <div className="mt-1 text-sm text-slate-500">
      Click here to choose your logo
    </div>

    <div className="mt-1 text-xs text-slate-400">
      PNG, JPG, WebP or SVG · Maximum 2 MB
    </div>
  </div>

  <input
    type="file"
    accept="image/png,image/jpeg,image/webp,image/svg+xml"
    onChange={upload}
    disabled={uploading}
    className="hidden"
  />
</label>
        </div>
        <div className="space-y-5">
          {([["Primary Colour","primary_colour"],["Secondary Colour","secondary_colour"],["Accent Colour","accent_colour"]] as const).map(([label,key])=>{
            const value=key==="accent_colour"?accent:(company[key]||"");
            return <div key={key}><label className="text-sm font-semibold">{label}</label><div className="mt-2 flex gap-3">
              <input type="color" value={value} onChange={e=>field(key,e.target.value)} className="h-12 w-16 rounded border p-1"/>
              <input value={value} onChange={e=>field(key,e.target.value)} className="flex-1 rounded border p-3 font-mono"/>
            </div></div>;
          })}
        </div>
      </div>
      <div className="mt-8 overflow-hidden rounded-xl border">
        <div className="p-7 text-white" style={{backgroundColor:company.primary_colour,borderBottom:`4px solid ${company.secondary_colour}`}}>
          <div className="flex items-center gap-5">{company.logo_url&&<img src={company.logo_url} alt="" className="max-h-16 max-w-40 object-contain"/>}<div><div className="text-2xl font-bold">{company.name}</div><div className="text-white/80">Newsletter Preview</div></div></div>
        </div>
        <div className="p-7"><p className="text-xs font-bold uppercase" style={{color:company.secondary_colour}}>Company Update</p><h3 className="mt-2 text-2xl font-bold">Your newsletter article heading</h3><p className="mt-3 text-slate-600">Branding changes are reflected in newsletters and campaign emails.</p><button type="button" className="mt-5 rounded px-5 py-3 font-semibold text-white" style={{backgroundColor:accent}}>Example Button</button></div>
      </div>
    </section>

    <section className="rounded-xl bg-white p-8 shadow">
      <h2 className="text-2xl font-bold">Company Details</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div><label className="text-sm font-semibold">Website</label><input value={company.website_url??""} onChange={e=>field("website_url",e.target.value)} className="mt-2 w-full rounded border p-3"/></div>
        <div><label className="text-sm font-semibold">Address</label><input value={company.company_address??""} onChange={e=>field("company_address",e.target.value)} className="mt-2 w-full rounded border p-3"/></div>
      </div>
    </section>

    <section className="rounded-xl bg-white p-8 shadow">
      <h2 className="text-2xl font-bold">Email Identity</h2>
      <p className="mt-2 text-sm text-slate-500">Sender domains must be verified in Resend before live sending.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <div><label className="text-sm font-semibold">Sender Name</label><input value={company.sender_name??""} onChange={e=>field("sender_name",e.target.value)} className="mt-2 w-full rounded border p-3"/></div>
        <div><label className="text-sm font-semibold">Sender Email</label><input type="email" value={company.sender_email??""} onChange={e=>field("sender_email",e.target.value)} className="mt-2 w-full rounded border p-3"/></div>
        <div><label className="text-sm font-semibold">Reply-To Email</label><input type="email" value={company.reply_to_email??""} onChange={e=>field("reply_to_email",e.target.value)} className="mt-2 w-full rounded border p-3"/></div>
      </div>
    </section>

    <button type="submit" disabled={saving||uploading} className="rounded-lg bg-slate-900 px-7 py-3 font-semibold text-white disabled:opacity-50">{saving?"Saving...":"Save Company Settings"}</button>
  </form>;
}
