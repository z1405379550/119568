var C='nfc-v5';
var A=['./index.html','./manifest.json'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(C).then(function(c){return c.addAll(A)}));
  self.skipWaiting();
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(k){
      return Promise.all(k.filter(function(n){return n!==C}).map(function(n){return caches.delete(n)}));
    }).then(function(){return self.clients.claim()})
  );
});

self.addEventListener('fetch',function(e){
  var req=e.request;

  // 只接管本站 GET 请求；POST（含发往钉钉的同步请求）一律原样放行，
  // 避免拦截或改写跨域 no-cors 请求导致同步失败。
  if(req.method!=='GET')return;
  try{
    var u=new URL(req.url);
    if(u.origin!==self.location.origin)return;
  }catch(err){return}

  // 页面与配置：网络优先，保证替换 index.html 后立即生效；离线时回退缓存。
  if(req.mode==='navigate'||u.pathname.indexOf('/index.html')>=0||u.pathname.endsWith('.json')||u.pathname.endsWith('.js')){
    e.respondWith(
      fetch(req).then(function(res){
        if(res&&res.ok){
          var copy=res.clone();
          caches.open(C).then(function(c){c.put(req,copy)}).catch(function(){});
        }
        return res;
      }).catch(function(){
        return caches.match(req).then(function(r){
          return r||caches.match('./index.html');
        });
      })
    );
    return;
  }
});
