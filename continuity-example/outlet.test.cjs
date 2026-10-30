'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function page(html, href) {
  const location = new URL(href);
  const anchors = [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map(m => ({
    href: m[1], textContent: m[2].replace(/<[^>]*>/g, ''), getAttribute(name) { return name === 'href' ? this.href : null; }
  }));
  const labels = [...html.matchAll(/<span data-alternative-store>([^<]*)<\/span>/g)].map(m => ({textContent:m[1]}));
  return {location, anchors, labels, document:{querySelectorAll(selector) { return selector === 'a[href]' ? anchors : selector === '[data-alternative-store]' ? labels : []; }}};
}
for (const [folder, slug, trial] of [['continuity-example','continuity-desk','two-shot-brief.html'],['lead-evidence-example','lead-evidence-desk','payment-check.html']]) {
  const dir = path.resolve(__dirname, '..', folder);
  const source = fs.readFileSync(path.join(dir,'outlet.js'),'utf8');
  const gumroad = 'https://jikkenlog.gumroad.com/l/'+slug;
  const itch = 'https://tiny-deduction-lab.itch.io/'+slug;
  for (const name of ['index.html',trial]) {
    const html=fs.readFileSync(path.join(dir,name),'utf8');
    const base='https://tomoka-uzumaki-ai.github.io/reply-review-desk-jp/'+folder+'/'+(name==='index.html'?'':name);
    assert.match(html, /src="outlet\.js\?v=20261030"/);
    assert.doesNotMatch(html, /script-src 'none'/);
    for (const suffix of ['', '?from=other', '?from=itch.example', '?From=itch']) {
      const p=page(html,base+suffix), before=JSON.stringify([p.anchors,p.labels]);
      vm.runInNewContext(source,{document:p.document,location:p.location,URL,URLSearchParams});
      assert.equal(JSON.stringify([p.anchors,p.labels]),before,folder+' default must remain untouched');
    }
    const p=page(html,base+'?from=itch');
    vm.runInNewContext(source,{document:p.document,location:p.location,URL,URLSearchParams});
    assert.ok(p.anchors.some(a=>a.href===itch && a.textContent!=='itch.io'),folder+' primary return to same itch product');
    assert.ok(!p.anchors.some(a=>a.textContent.includes('on Gumroad')&&a.href===itch));
    if(name==='index.html') {
      assert.ok(p.anchors.some(a=>a.href===gumroad&&a.textContent==='Gumroad'),folder+' alternative store remains valid');
      assert.ok(p.anchors.some(a=>a.href.endsWith('/'+trial+'?from=itch')),folder+' sample to trial retains source');
    } else assert.ok(p.anchors.some(a=>a.href.endsWith('/'+folder+'/?from=itch')),folder+' trial to sample retains source');
    assert.equal(p.anchors.find(a=>a.href.startsWith('../seller-desk/'))?.href, name==='index.html'?undefined:'../seller-desk/','unrelated workflow untouched');
    assert.ok(p.labels.every(l=>l.textContent==='Gumroad'));
  }
  const extra='<a href="two-shot-brief.html?test=1#details">same</a><a href="https://example.com/?from=itch">elsewhere</a><a href="https://jikkenlog.gumroad.com/l/not-this-product">another product</a><a href="#top">jump</a>';
  const p=page(extra,'https://tomoka-uzumaki-ai.github.io/reply-review-desk-jp/'+folder+'/?from=itch');
  vm.runInNewContext(source,{document:p.document,location:p.location,URL,URLSearchParams});
  if(folder==='continuity-example') assert.equal(p.anchors[0].href,'/reply-review-desk-jp/continuity-example/two-shot-brief.html?test=1&from=itch#details');
  assert.equal(p.anchors[1].href,'https://example.com/?from=itch');
  assert.equal(p.anchors[2].href,'https://jikkenlog.gumroad.com/l/not-this-product');
  assert.equal(p.anchors[3].href,'#top');
}
console.log('PASS: both product samples/trials preserve default store; exact itch routing, alternative store, internal query/hash and unrelated-link isolation.');
