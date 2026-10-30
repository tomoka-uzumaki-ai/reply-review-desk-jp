'use strict';
const D=window.BatchDesk;
let batch=D.normalize(D.example()),dirty=false,restoreEpoch=0;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines=v=>v.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
const stableId=prefix=>prefix+'-'+(crypto.randomUUID?crypto.randomUUID().slice(0,8):Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6));
const status=message=>{$('status').textContent=message;};
function field(kind,id,key,label,value,options){const attrs=`data-kind="${kind}" data-id="${esc(id)}" data-key="${key}"`;const uid=kind+'-'+id+'-'+key;
  let input;if(options)input=`<select id="${esc(uid)}" ${attrs}>${options.map(([v,l])=>`<option value="${v}" ${value===v?'selected':''}>${l}</option>`).join('')}</select>`;
  else if(['files','rights'].includes(key))input=`<textarea id="${esc(uid)}" ${attrs}>${esc(Array.isArray(value)?value.join('\n'):value)}</textarea>`;
  else input=`<input id="${esc(uid)}" ${attrs} value="${esc(value)}" ${key==='price'?'inputmode="decimal"':''}>`;
  return `<label class="${['title','files','rights','platform'].includes(key)?'wide':''}" for="${esc(uid)}">${label}${input}</label>`;
}
function render(){
  $('works').innerHTML=batch.works.length?batch.works.map(w=>`<article class="card"><div class="topline"><h3>${esc(w.id)}</h3><button data-action="remove-work" data-id="${esc(w.id)}">Remove</button></div><div class="fields">${field('work',w.id,'title','Work title',w.title)}${field('work',w.id,'ai','AI provenance',w.ai,[['unknown','Unknown — review'],['human','Human made'],['assisted','AI assisted'],['generated','AI generated']])}${field('work',w.id,'rights','Ownership / license note',w.rights)}${field('work',w.id,'files','Recorded filenames · one per line',w.files)}</div></article>`).join(''):'<p class="empty">Add a work or load the synthetic example.</p>';
  $('offers').innerHTML=batch.offers.length?batch.offers.map(o=>`<article class="card"><div class="topline"><h3>${esc(o.id)}</h3><button data-action="remove-offer" data-id="${esc(o.id)}">Remove</button></div><div class="fields">${field('offer',o.id,'title','Offer name',o.title)}${field('offer',o.id,'type','Sales unit',o.type,[['single','Single purchase'],['monthly','Monthly bundle']])}${field('offer',o.id,'period','Monthly period · YYYY-MM',o.period)}${field('offer',o.id,'status','Your release record',o.status,[['draft','Draft'],['released','Previously released']])}</div><p class="small">Assigned works</p><div class="checks">${batch.works.map(w=>`<label><input type="checkbox" data-kind="assignment" data-id="${esc(o.id)}" data-work="${esc(w.id)}" ${o.workIds.includes(w.id)?'checked':''}>${esc(w.id)} · ${esc(w.title)}</label>`).join('')}${o.workIds.filter(id=>!batch.works.some(w=>w.id===id)).map(id=>`<p class="issue block">Missing assigned work: ${esc(id)} <button data-action="remove-missing" data-id="${esc(o.id)}" data-work="${esc(id)}">Unassign</button></p>`).join('')}</div>${o.variants.map(v=>`<div class="variant"><div class="topline"><span class="badge">${esc(v.id)}</span><button data-action="remove-variant" data-id="${esc(v.id)}">Remove destination</button></div><div class="fields">${field('variant',v.id,'platform','Destination · your label',v.platform)}${field('variant',v.id,'title','Destination product title',v.title)}${field('variant',v.id,'price','Price · no fees deducted',v.price)}${field('variant',v.id,'currency','Currency · e.g. USD',v.currency)}${field('variant',v.id,'files','Delivery filename manifest · one per line',v.files)}</div><button data-action="copy-files" data-id="${esc(v.id)}">Fill from assigned works</button></div>`).join('')}<button data-action="add-variant" data-id="${esc(o.id)}">Add destination variant</button></article>`).join(''):'<p class="empty">Add an offer to assign your works.</p>';
  refresh();
}
function refresh(){const issues=D.check(batch);$('counts').textContent=issues.filter(i=>i.level==='block').length+' missing / '+issues.filter(i=>i.level==='review').length+' review';$('issues').innerHTML=issues.length?issues.map(i=>`<div class="issue ${i.level}"><strong>${esc(i.level.toUpperCase())} · ${esc(i.scope)} · ${esc(i.code)}</strong><div>${esc(i.message)}</div></div>`).join(''):'<p>No recorded-data issues found. You still need to inspect actual files and destination conditions.</p>';$('preview').textContent=D.handoff(batch);}
function commit(edit){try{const candidate=D.mutate(batch,edit);batch=candidate;restoreEpoch++;dirty=true;status('Unsaved changes. Download JSON to keep this batch.');refresh();return true;}catch(error){status(error.message);return false;}}
function findObject(state,kind,id){if(kind==='work')return state.works.find(w=>w.id===id);if(kind==='offer')return state.offers.find(o=>o.id===id);return state.offers.flatMap(o=>o.variants).find(v=>v.id===id);}
document.addEventListener('input',e=>{const t=e.target;if(!t.dataset.kind||t.dataset.kind==='assignment')return;const old=findObject(batch,t.dataset.kind,t.dataset.id);if(!old)return;
  const value=t.dataset.key==='files'?lines(t.value):t.value;
  if(!commit(candidate=>{findObject(candidate,t.dataset.kind,t.dataset.id)[t.dataset.key]=value;}))t.value=Array.isArray(old[t.dataset.key])?old[t.dataset.key].join('\n'):old[t.dataset.key];
});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.kind==='assignment'){const selected=t.checked;if(!commit(candidate=>{const o=candidate.offers.find(o=>o.id===t.dataset.id);o.workIds=selected?[...new Set([...o.workIds,t.dataset.work])]:o.workIds.filter(id=>id!==t.dataset.work);}))t.checked=batch.offers.find(o=>o.id===t.dataset.id).workIds.includes(t.dataset.work);}});
document.addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;const {action,id,work}=b.dataset;
  if(action==='remove-work'&&!confirm('Remove '+id+'? Offer references will remain visible as missing until you fix them.'))return;
  if(action==='remove-offer'&&!confirm('Remove offer '+id+' and its destination variants?'))return;
  if(action==='copy-files'){const current=batch.offers.flatMap(o=>o.variants).find(v=>v.id===id);if(current?.files.length&&!confirm('Replace this delivery list with the filenames of all assigned works?'))return;}
  if(commit(candidate=>{
    if(action==='remove-work')candidate.works=candidate.works.filter(w=>w.id!==id);
    if(action==='remove-offer')candidate.offers=candidate.offers.filter(o=>o.id!==id);
    if(action==='remove-missing'){const o=candidate.offers.find(o=>o.id===id);o.workIds=o.workIds.filter(w=>w!==work);}
    if(action==='add-variant')candidate.offers.find(o=>o.id===id).variants.push({id:stableId('VAR'),platform:'',title:'',price:'',currency:'USD',files:[]});
    if(action==='remove-variant')for(const o of candidate.offers)o.variants=o.variants.filter(v=>v.id!==id);
    if(action==='copy-files')for(const o of candidate.offers){const v=o.variants.find(v=>v.id===id);if(v)v.files=[...new Set(o.workIds.flatMap(id=>candidate.works.find(w=>w.id===id)?.files||[]))];}
  }))render();
});
function download(name,contents,type){const url=URL.createObjectURL(new Blob([contents],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('save').onclick=()=>{try{download('publication-batch.json',D.toJSON(batch),'application/json');dirty=false;status('JSON download requested. Check that the file was saved; restoring it recreates this batch.');}catch(error){status(error.message);}};
$('csvout').onclick=()=>{try{download('publication-batch.csv',D.toCSV(batch),'text/csv;charset=utf-8');status('CSV download requested. Formula prefixes are escaped. JSON remains the simplest backup.');}catch(error){status(error.message);}};
$('txt').onclick=()=>{download('publication-handoff.txt',D.handoff(batch),'text/plain;charset=utf-8');status('Manual handoff download requested. It lists filenames and unresolved checks; no media is included.');};
async function restore(file,kind,input){const request=++restoreEpoch;if(!file)return;try{if(file.size>D.MAX_BYTES)throw Error('Import exceeds 2,000,000 UTF-8 bytes.');const raw=await file.text();if(request!==restoreEpoch)return;const candidate=kind==='csv'?D.fromCSV(raw):D.fromJSON(raw);if(!confirm('Replace the current batch with '+file.name+'? Save your current JSON first if needed.'))return;batch=candidate;dirty=true;render();status('Imported '+file.name+'. Review the checks and save a JSON backup.');}catch(err){if(request===restoreEpoch)status('Import failed; current batch kept. '+err.message);}finally{if(request===restoreEpoch)input.value='';}}
$('restore').onchange=e=>restore(e.target.files[0],'json',e.target);$('csvin').onchange=e=>restore(e.target.files[0],'csv',e.target);
$('addwork').onclick=()=>{if(commit(candidate=>{candidate.works.push({id:stableId('WORK'),title:'',ai:'unknown',rights:'',files:[]});}))render();};
$('addoffer').onclick=()=>{if(commit(candidate=>{candidate.offers.push({id:stableId('OFFER'),title:'',type:'single',period:'',status:'draft',workIds:[],variants:[]});}))render();};
$('example').onclick=()=>{if(!confirm('Replace the current batch with the synthetic example?'))return;if(commit(candidate=>{Object.assign(candidate,D.example());})){render();status('Synthetic example loaded. It deliberately includes overlap and missing provenance/files.');}};
$('clear').onclick=()=>{if(!confirm('Start empty? Save the current JSON first if needed.'))return;if(commit(candidate=>{candidate.works=[];candidate.offers=[];}))render();};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
render();
