// Stale-while-revalidate: mở app tức thì từ bộ nhớ đệm, đồng thời tải bản mới ở nền.
// Khi có bản mới, trang đang ở menu sẽ tự tải lại một lần.
const V='bh-v28',A=['./','index.html','icon.svg','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(A.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const tag=r=>r&&(r.headers.get('etag')||r.headers.get('last-modified')||r.headers.get('content-length')||'');
self.addEventListener('fetch',e=>{
  const q=e.request;
  if(q.method!=='GET'||!q.url.startsWith(self.location.origin))return;
  e.respondWith((async()=>{
    const c=await caches.open(V),hit=await c.match(q,{ignoreSearch:true});
    const net=fetch(q).then(async r=>{
      if(r&&r.ok){
        const old=hit?tag(hit):null,nw=tag(r);
        c.put(q,r.clone());
        if(hit&&old&&nw&&old!==nw&&(q.mode==='navigate'||/index\.html$/.test(q.url))){
          const cl=await self.clients.matchAll();cl.forEach(x=>x.postMessage('upd'));
        }
      }
      return r;
    }).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    const r=await net;
    return r||(await c.match('index.html'))||Response.error();
  })());
});
