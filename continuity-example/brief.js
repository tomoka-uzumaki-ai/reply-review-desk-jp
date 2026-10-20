/* Two-shot text brief, independent of the paid planner. */
(function(root){
"use strict";
function brief(input){
 const fields=["canon","first","next","change"];
 const clean={};
 for(const key of fields){const s=String(input[key]??"").trim();if(!s)throw Error("Complete the fixed character and both shots, including the intended change.");if(s.length>1600)throw Error("Keep each field within 1600 characters.");clean[key]=s;}
 return ["TWO-SHOT CHARACTER HANDOFF",
 "FIXED CHARACTER — retain unless a new canon is explicitly approved",clean.canon,
 "SHOT 1 — current baseline",clean.first,
 "SHOT 2 — requested scene",clean.next,
 "INTENDED CHANGE ONLY",clean.change,
 "MANUAL REVIEW BEFORE GENERATING",
 "Compare identity, wardrobe, props, pose, lighting and scene. Decide explicitly which details must change and which must stay.",
 "Check that hands, carried props, supports and actions are physically compatible.",
 "A contradictory instruction needs a human decision; this tool does not detect image errors or guarantee character consistency.",
 "Use only original or authorized references. No reference images are included in this note."].join("\n\n");
}
if(typeof module!=="undefined")module.exports={brief};root.TwoShotBrief={brief};
if(typeof document==="undefined")return;
const form=document.getElementById("brief-form"),out=document.getElementById("brief-output"),download=document.getElementById("download");
let current="";
form.addEventListener("submit",e=>{e.preventDefault();try{current=brief(Object.fromEntries(new FormData(form)));out.textContent=current;download.disabled=false;}catch(err){current="";out.textContent=err.message;download.disabled=true;}});
form.addEventListener("input",()=>{current="";download.disabled=true;out.textContent="Brief changed. Build again before downloading.";});
download.addEventListener("click",()=>{if(!current)return;const url=URL.createObjectURL(new Blob([current],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="two-shot-character-handoff.txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
})(typeof globalThis!=="undefined"?globalThis:this);

