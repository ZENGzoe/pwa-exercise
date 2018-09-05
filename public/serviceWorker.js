var cacheName = 'news-v1',
    fetchCacheName = 'news-api-v1',
    cacheFiles = [
        '/',
        './index.html',
        './js/index.js',
        './css/index.css',
        './img/white.jpg'
    ],
    cacheFetchUrls = [
        '/news?'
    ];

    //监听service worker安装事件
self.addEventListener('install', function(e){
    console.log('install');
    //在安装前执行
    e.waitUntil(
        //存储
        caches.open(cacheName).then(function(cache){
            return cache.addAll(cacheFiles);
        })
    )
})

//监听激活事件，删除无用的缓存
self.addEventListener('activate', function(e){
    //在激活前之行
    e.waitUntil(
        caches.keys().then(function(keys){
            return Promise().all(keys.map(function(key){
                //通过修改cacheName来更新缓存，并删掉无用缓存
                if(key !== cacheName){
                    return caches.delete(key)
                }
            }))
        })
    )
    return self.clients.claim();
})

//监听客户端请求事件
self.addEventListener('fetch' , function(e){
    
    var needCache = cacheFetchUrls.some(function(url){
        return e.request.url.indexOf(url) > 1;
    })

    if(needCache){
        caches.open(fetchCacheName).then(function(cache){
            return fetch(e.request).then(function(response){
                //缓存请求
                if(response.statusText !== 'Not Found'){
                    cache.put(e.request.url,response.clone())
                }
                return response;
            })
        })
    }else{

        e.respondWith(
            caches.match(e.request).then(function(cache){
                //返回缓存的静态资源
                return cache || fetch(e.request)
            }).catch(function(err){
                console.log('err',err);
                return fetch(e.request)
            })
        )
    }
})