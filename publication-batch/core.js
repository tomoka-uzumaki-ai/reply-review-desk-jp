(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BatchDesk=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='0.1.0', SCHEMA=1, MAX_BYTES=2000000;
  const utf8Bytes=v=>new TextEncoder().encode(v).length;
  const HEADERS=['record_type','id','parent_id','title','ai_provenance','rights_note','files','offer_type','period','work_ids','platform','price','currency','release_status'];
  const text=v=>String(v??'');
  function example(){return {schema:SCHEMA,version:VERSION,works:[
    {id:'WORK-001',title:'Morning garden illustration',ai:'human',rights:'Created and owned by the example maker; not a legal assessment.',files:['garden-print.png','garden-preview.jpg']},
    {id:'WORK-002',title:'Evening garden illustration',ai:'assisted',rights:'Example maker records an AI assisted workflow; confirm actual license separately.',files:['evening-print.png']},
    {id:'WORK-003',title:'Cloud study',ai:'unknown',rights:'Source and license need review.',files:[]}
  ],offers:[
    {id:'OFFER-001',title:'Garden print',type:'single',period:'',status:'released',workIds:['WORK-001'],variants:[{id:'VAR-001',platform:'Store A (example)',title:'Morning garden — printable illustration',price:'4',currency:'USD',files:['garden-print.png','garden-preview.jpg']}]},
    {id:'OFFER-002',title:'October garden collection',type:'monthly',period:'2026-10',status:'draft',workIds:['WORK-001','WORK-002'],variants:[{id:'VAR-002',platform:'Store B (example)',title:'October: two garden illustrations',price:'6',currency:'USD',files:['garden-print.png','evening-print.png']}]}
  ]};}
  function normalize(input){
    if(!input||input.schema!==SCHEMA||!Array.isArray(input.works)||!Array.isArray(input.offers))throw Error('Unsupported data. Expected schema 1 with works and offers.');
    const arr=(v,name)=>{if(!Array.isArray(v))throw Error(name+' must be an array.');return v.map(text);};
    const state={schema:SCHEMA,version:VERSION,works:input.works.map(w=>({id:text(w.id),title:text(w.title),ai:text(w.ai||'unknown'),rights:text(w.rights),files:arr(w.files,'Work filenames')})),offers:input.offers.map(o=>({id:text(o.id),title:text(o.title),type:text(o.type),period:text(o.period),status:text(o.status||'draft'),workIds:arr(o.workIds,'Assigned work IDs'),variants:arrObjects(o.variants).map(v=>({id:text(v.id),platform:text(v.platform),title:text(v.title),price:text(v.price),currency:text(v.currency),files:arr(v.files,'Delivery filenames')}))}))};
    const seen=new Set();for(const item of [...state.works,...state.offers,...state.offers.flatMap(o=>o.variants)]){if(!item.id||seen.has(item.id))throw Error('Missing or duplicate stable ID: '+item.id);seen.add(item.id);}
    return assertRestorable(state);
  }
  function jsonUnchecked(state){return JSON.stringify(state,null,2)+'\n';}
  function assertRestorable(state){
    const jsonBytes=utf8Bytes(jsonUnchecked(state)),csvBytes=utf8Bytes(csvUnchecked(state));
    if(jsonBytes>MAX_BYTES||csvBytes>MAX_BYTES){const error=new RangeError('This change exceeds the 2,000,000-byte restore limit (JSON '+jsonBytes+' bytes; CSV '+csvBytes+' bytes). Current batch kept. Save a backup, then use a smaller batch.');error.code='WORKSPACE_LIMIT';error.jsonBytes=jsonBytes;error.csvBytes=csvBytes;throw error;}
    return state;
  }
  function mutate(input,edit){const candidate=JSON.parse(JSON.stringify(input));edit(candidate);return normalize(candidate);}
  function toJSON(input){return jsonUnchecked(normalize(input));}
  function fromJSON(raw){if(utf8Bytes(raw)>MAX_BYTES)throw Error('JSON exceeds 2,000,000 UTF-8 bytes.');return normalize(JSON.parse(raw));}
  function arrObjects(v){if(!Array.isArray(v))throw Error('Variants must be an array.');return v;}
  function check(input){const s=normalize(input),issues=[],byId=new Map(s.works.map(w=>[w.id,w]));
    const add=(level,code,scope,message)=>issues.push({level,code,scope,message});
    const safeFile=n=>!!n.trim()&&!/[\\/\x00-\x1f]/.test(n)&&n!=='.'&&n!=='..';
    for(const w of s.works){
      if(!w.title.trim())add('block','WORK_TITLE',w.id,'Give this work a title.');
      if(!['human','assisted','generated'].includes(w.ai))add('review','UNKNOWN_AI',w.id,'AI provenance is unknown or unrecognized. Record the actual workflow.');
      if(!w.rights.trim())add('review','RIGHTS_NOTE',w.id,'Record the ownership or license basis. A note does not establish legal clearance.');
      if(!w.files.length)add('block','WORK_FILES',w.id,'No filenames are recorded for this work.');
      for(const f of w.files)if(!safeFile(f))add('block','FILENAME',w.id,'Use a filename without folders/control characters: '+f);
      if(new Set(w.files).size!==w.files.length)add('review','DUPLICATE_FILE',w.id,'Repeated filenames within this work.');
    }
    const filenameOwners=new Map();for(const w of s.works)for(const f of w.files){const ids=filenameOwners.get(f)||[];if(!ids.includes(w.id))ids.push(w.id);filenameOwners.set(f,ids);}
    for(const [f,ids]of filenameOwners)if(ids.length>1)add('review','FILE_COLLISION',ids.join(', '),'Different work IDs use the same filename: '+f);
    for(const o of s.offers){
      if(!o.title.trim())add('block','OFFER_TITLE',o.id,'Give this offer a title.');
      if(!['single','monthly'].includes(o.type))add('block','OFFER_TYPE',o.id,'Choose single purchase or monthly bundle.');
      if(o.type==='monthly'&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(o.period))add('block','PERIOD',o.id,'Monthly bundle needs a YYYY-MM period.');
      if(!['draft','released'].includes(o.status))add('review','STATUS',o.id,'Record draft or previously released.');
      if(!o.workIds.length)add('block','EMPTY_OFFER',o.id,'Assign at least one work.');
      if(new Set(o.workIds).size!==o.workIds.length)add('review','DUPLICATE_ASSIGNMENT',o.id,'A work is assigned more than once.');
      for(const id of o.workIds)if(!byId.has(id))add('block','MISSING_WORK',o.id,'Unknown assigned work ID: '+id);
      if(!o.variants.length)add('block','NO_VARIANT',o.id,'Add a destination variant.');
      const ownedFiles=new Set(o.workIds.flatMap(id=>byId.get(id)?.files||[]));
      for(const v of o.variants){
        if(!v.platform.trim()||!v.title.trim())add('block','VARIANT_TEXT',v.id,'Destination and product title are required.');
        if(!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(v.price)||Number(v.price)<=0)add('block','PRICE',v.id,'Record a positive price with up to two decimal places.');
        if(!/^[A-Z]{3}$/.test(v.currency))add('block','CURRENCY',v.id,'Record a three-letter uppercase currency code; confirm support at the destination.');
        if(!v.files.length)add('block','DELIVERY_FILES',v.id,'Record the delivery filenames for this destination.');
        for(const f of v.files){if(!safeFile(f))add('block','FILENAME',v.id,'Invalid delivery filename: '+f);if(!ownedFiles.has(f))add('block','UNASSIGNED_FILE',v.id,'Delivery filename is not in the assigned works: '+f);}
        for(const id of o.workIds){const w=byId.get(id);if(w&&!w.files.some(f=>v.files.includes(f)))add('block','WORK_NOT_DELIVERED',v.id,'No delivery filename represents '+id+'.');}
        if(new Set(v.files).size!==v.files.length)add('review','DUPLICATE_FILE',v.id,'Delivery list repeats a filename.');
      }
    }
    const assigned=new Map();for(const o of s.offers)for(const id of new Set(o.workIds)){const list=assigned.get(id)||[];list.push(o);assigned.set(id,list);}
    for(const [id,list]of assigned)if(list.length>1)add('review','CONTENT_OVERLAP',id,'Known overlap in '+list.map(o=>o.id+' ('+o.type+', '+o.status+')').join(' and ')+'. Explain reused content before offering it twice.');
    const currencies=[...new Set(s.offers.flatMap(o=>o.variants.map(v=>v.currency)).filter(Boolean))];
    if(currencies.length>1)add('review','MIXED_CURRENCIES','Batch','Prices use '+currencies.join(', ')+'. No combined monetary total or conversion is calculated.');
    return issues;
  }
  function csvSafe(v){v=text(v);if(v.startsWith("'"))return "'"+v;return /^\s*[=+\-@\t\r]/.test(v)?"'"+v:v;}
  function csvUndo(v){if(v.startsWith("''"))return v.slice(1);if(/^'\s*[=+\-@\t\r]/.test(v))return v.slice(1);return v;}
  const quote=v=>'"'+csvSafe(v).replace(/"/g,'""')+'"';
  function csvUnchecked(s){const rows=[];const row=obj=>rows.push(HEADERS.map(h=>obj[h]??''));
    for(const w of s.works)row({record_type:'work',id:w.id,title:w.title,ai_provenance:w.ai,rights_note:w.rights,files:JSON.stringify(w.files)});
    for(const o of s.offers){row({record_type:'offer',id:o.id,title:o.title,offer_type:o.type,period:o.period,work_ids:JSON.stringify(o.workIds),release_status:o.status});for(const v of o.variants)row({record_type:'variant',id:v.id,parent_id:o.id,title:v.title,files:JSON.stringify(v.files),platform:v.platform,price:v.price,currency:v.currency});}
    return '\uFEFF'+[HEADERS,...rows].map(r=>r.map(quote).join(',')).join('\r\n')+'\r\n';
  }
  function toCSV(input){return csvUnchecked(normalize(input));}
  function parseCSV(raw){if(utf8Bytes(raw)>MAX_BYTES)throw Error('CSV exceeds 2,000,000 UTF-8 bytes.');const s=raw.replace(/^\uFEFF/,''),rows=[];let row=[],field='',quoted=false,closed=false;
    const cell=()=>{row.push(csvUndo(field));field='';closed=false;};const line=()=>{cell();if(row.some(v=>v!==''))rows.push(row);row=[];};
    for(let i=0;i<s.length;i++){const c=s[i];if(quoted){if(c==='"'){if(s[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;}
      else if(c==='"'){if(field||closed)throw Error('Invalid CSV quote.');quoted=true;}
      else if(c===',')cell();else if(c==='\r'||c==='\n'){if(c==='\r'&&s[i+1]==='\n')i++;line();}
      else{if(closed)throw Error('Unexpected text after CSV quote.');field+=c;}}
    if(quoted)throw Error('Unclosed CSV quote.');if(field||row.length||closed)line();return rows;
  }
  function fromCSV(raw){const rows=parseCSV(raw),headers=rows.shift();if(!headers||headers.length!==HEADERS.length||headers.some((h,i)=>h!==HEADERS[i]))throw Error('CSV headers do not match the exported template.');const s={schema:SCHEMA,works:[],offers:[]},variants=[];
    const arr=v=>{const a=JSON.parse(v||'[]');if(!Array.isArray(a))throw Error('CSV list fields must be JSON arrays.');return a;};
    for(const cells of rows){if(cells.length!==HEADERS.length)throw Error('CSV row has the wrong column count.');const r=Object.fromEntries(HEADERS.map((h,i)=>[h,cells[i]]));if(r.record_type==='work')s.works.push({id:r.id,title:r.title,ai:r.ai_provenance,rights:r.rights_note,files:arr(r.files)});else if(r.record_type==='offer')s.offers.push({id:r.id,title:r.title,type:r.offer_type,period:r.period,status:r.release_status,workIds:arr(r.work_ids),variants:[]});else if(r.record_type==='variant')variants.push(r);else throw Error('Unknown CSV record type: '+r.record_type);}
    for(const r of variants){const o=s.offers.find(o=>o.id===r.parent_id);if(!o)throw Error('Variant has unknown parent: '+r.parent_id);o.variants.push({id:r.id,platform:r.platform,title:r.title,price:r.price,currency:r.currency,files:arr(r.files)});}return normalize(s);
  }
  function handoff(input){const s=normalize(input),issues=check(s);const lines=['PUBLICATION BATCH DESK '+VERSION,'MANUAL PUBLICATION HANDOFF — NOT PLATFORM APPROVAL','','Recorded filenames only. This export contains no artwork bytes, no upload, and no legal clearance.','Compare the actual files, current destination rules, currency support, fees and content disclosures before publishing.','No publication, payment, audience response or revenue is verified.',''];
    for(const o of s.offers){lines.push('OFFER '+o.id+' | '+o.title,'Type: '+o.type+' | Period: '+(o.period||'not monthly')+' | Recorded status: '+o.status,'Assigned work IDs: '+o.workIds.join(', '));for(const id of o.workIds){const w=s.works.find(w=>w.id===id);lines.push(w?'  '+w.id+' | '+w.title+' | AI: '+w.ai+' | Ownership/license note: '+(w.rights||'unknown'):'  Missing work: '+id);}
      for(const v of o.variants){lines.push('DESTINATION '+v.id+' | '+v.platform,'Product title: '+v.title,'Price: '+v.price+' '+v.currency,'Filename manifest:');for(const f of v.files)lines.push('  [ ] '+f+' — locate and inspect actual file bytes');lines.push('  [ ] Confirm current destination rules and actual AI disclosure','  [ ] Confirm price, currency, fees and manual product fields','  [ ] Explain any previously released/overlapping content','  [ ] Preview actual customer delivery before manual publication');}lines.push('');}
    lines.push('BATCH CHECKS');if(!issues.length)lines.push('No recorded-data issue detected. This is not approval or evidence that files exist.');for(const i of issues)lines.push('['+i.level.toUpperCase()+'] '+i.code+' / '+i.scope+': '+i.message);return lines.join('\n')+'\n';
  }
  return {VERSION,MAX_BYTES,utf8Bytes,HEADERS,example,normalize,mutate,check,toJSON,fromJSON,toCSV,fromCSV,handoff};
});
