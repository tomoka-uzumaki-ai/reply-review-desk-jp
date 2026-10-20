/* Free two-shot text brief with an optional project-data export. */
(function(root){
"use strict";
function cleanBrief(input){
 const fields=["canon","first","next","change"];
 const clean={};
 for(const key of fields){const s=String(input[key]??"").trim();if(!s)throw Error("Complete the fixed character and both shots, including the intended change.");if(s.length>1600)throw Error("Keep each field within 1600 characters.");clean[key]=s;}
 return clean;
}
function brief(input){
 const clean=cleanBrief(input);
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
function project(input){
 const clean=cleanBrief(input),meta={};
 for(const key of ["name","wardrobe"]){const s=String(input[key]??"").trim();if(!s)throw Error("For project JSON, add the character name and fixed wardrobe in the optional planner details.");if(s.length>1600)throw Error("Keep each planner detail within 1600 characters.");meta[key]=s;}
 for(const key of ["hands1","hands2"]){const s=String(input[key]??"").trim();if(!/^[012]$/.test(s))throw Error("For project JSON, choose the hands required for each shot in the optional planner details.");meta[key]=s;}
 const plan1={name:meta.name,identity:clean.canon,wardrobe:meta.wardrobe,style:"",light:"",action:"",prop:"",hands:meta.hands1,angle:"",scene:clean.first,rights:""};
 const plan2={...plan1,hands:meta.hands2,scene:clean.next};
 const shot=(id,plan,note)=>({id,canonId:"free-two-shot-canon",plan,referenceIds:[],review:{status:"unreviewed",note,resultFilename:""},history:[]});
 return {schema:"continuity-desk-v2",canons:[{id:"free-two-shot-canon",label:"Imported two-shot brief",value:plan1}],activeCanonId:"free-two-shot-canon",current:plan2,shots:[shot("free-two-shot-1",plan1,""),shot("free-two-shot-2",plan2,clean.change)],reference_notes:Array(6).fill(null)};
}
const api={brief,project};
if(typeof module!=="undefined")module.exports=api;root.TwoShotBrief=api;
if(typeof document==="undefined")return;
const form=document.getElementById("brief-form"),out=document.getElementById("brief-output"),download=document.getElementById("download"),projectDownload=document.getElementById("download-project"),projectStatus=document.getElementById("project-status");
let built=null;
const readInput=()=>Object.fromEntries(new FormData(form));
function invalidate(){built=null;download.disabled=true;projectDownload.disabled=true;out.textContent="Brief changed. Build again before downloading.";projectStatus.textContent="";}
function currentBuild(){if(!built)return null;if(JSON.stringify(readInput())!==JSON.stringify(built.input)){invalidate();return null;}return built;}
function save(content,name,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
form.addEventListener("submit",e=>{e.preventDefault();try{const input=readInput(),text=brief(input);built={input,text};out.textContent=text;download.disabled=false;projectDownload.disabled=false;projectStatus.textContent="";}catch(err){built=null;out.textContent=err.message;download.disabled=true;projectDownload.disabled=true;projectStatus.textContent="";}});
form.addEventListener("input",invalidate);
form.addEventListener("change",invalidate);
download.addEventListener("click",()=>{const state=currentBuild();if(state)save(state.text,"two-shot-character-handoff.txt","text/plain;charset=utf-8");});
projectDownload.addEventListener("click",()=>{const state=currentBuild();if(!state)return;try{save(JSON.stringify(project(state.input),null,2),"continuity-project.json","application/json;charset=utf-8");projectStatus.textContent="Project JSON downloaded. In the full planner, export any existing work first, then choose Restore project. Both shots are unreviewed. No reference images or permission notes are included.";}catch(err){projectStatus.textContent=err.message;}});
})(typeof globalThis!=="undefined"?globalThis:this);
