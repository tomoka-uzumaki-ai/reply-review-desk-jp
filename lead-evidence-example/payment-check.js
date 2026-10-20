/* Free single-order arithmetic. No storage, network, customer records or paid code. */
(function(root){
"use strict";
function amount(value,currency){
 const s=String(value??"").trim(),places=currency==="JPY"?0:2;
 if(!s)return null;
 const re=places===0?/^\d{1,9}$/:/^\d{1,9}(\.\d{1,2})?$/;
 if(!re.test(s))throw Error("Use a non-negative amount without commas, with "+places+" decimal places at most.");
 const parts=s.split(".");return Number(parts[0])*100+Number((parts[1]||"").padEnd(2,"0"));
}
function check(input){
 const currency=input.currency;
 if(!["USD","JPY","EUR","GBP"].includes(currency))throw Error("Choose one supported currency.");
 const agreed=amount(input.agreed,currency),received=amount(input.received,currency),refund=amount(input.refund,currency);
 const known=received!==null&&refund!==null;
 const net=known?received-refund:null;
 const due=input.confirmed&&agreed!==null&&known?Math.max(0,agreed-net):null;
 const credit=input.confirmed&&agreed!==null&&known?Math.max(0,net-agreed):null;
 return {currency,agreed,received,refund,net,due,credit,confirmed:!!input.confirmed,review:known&&refund>received};
}
function money(n,c){return n===null?"Not known":new Intl.NumberFormat("en",{style:"currency",currency:c}).format(n/100);}
function note(r){
 return ["ONE COMMISSION · MANUALLY ENTERED CHECK",
 "Currency: "+r.currency,"Agreed work confirmed: "+(r.confirmed?"Yes, according to your entry":"Not confirmed"),
 "Agreed amount: "+money(r.agreed,r.currency),"Received: "+money(r.received,r.currency),
 "Refunded: "+money(r.refund,r.currency),"Known net cash: "+money(r.net,r.currency),
 "Remaining under the entered agreement: "+money(r.due,r.currency),
 "Overpayment to review: "+money(r.credit,r.currency),
 r.review?"REVIEW: refunds exceed received cash in the entered records. Check missing or out-of-period receipts.":"",
 "Not a receipt, profit calculation, bank verification, invoice or legal determination.",
 "Missing amounts stay unknown. Enter 0 only when you have checked that there was none."].filter(Boolean).join("\n");
}
const api={amount,check,note};if(typeof module!=="undefined")module.exports=api;root.CommissionCheck=api;
if(typeof document==="undefined")return;
const form=document.getElementById("check-form"),result=document.getElementById("result"),download=document.getElementById("download");
let current="";
form.addEventListener("submit",function(e){e.preventDefault();try{
 const data=Object.fromEntries(new FormData(form));data.confirmed=form.elements.confirmed.checked;
 current=note(check(data));result.textContent=current;download.disabled=false;
}catch(err){current="";result.textContent=err.message;download.disabled=true;}});
form.addEventListener("input",function(){current="";download.disabled=true;result.textContent="Inputs changed. Check again to refresh the result.";});
download.addEventListener("click",function(){if(!current)return;const url=URL.createObjectURL(new Blob([current],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="commission-payment-check.txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
})(typeof globalThis!=="undefined"?globalThis:this);

