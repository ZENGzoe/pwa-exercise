var cacheName = 'news-v1',
    fetchCacheName = 'news-api-v1',
    cacheFiles = [
        '/',
        './index.html',
        './js/index.js',
        './js/lib.js',
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

//监听push事件
self.addEventListener('push' , function(e){
    var data = e.data;
    if(e.data){
        data = data.json();
        console.log('push的数据为：',data);
        var title = data;
        var options = {
            body : 'PWA学习',
            icon : '/img/icon_128.png',
            actions : [{
                action : 'show-jd',
                title : '去京东'
            },{
                action : 'contact-me',
                title : '联系我'
            }],
            tag : 'pwa-starter',
            renotify : true
        };
        self.registration.showNotification(title,options);
    }else{
        console.log('push没有任何数据')
    }
})

//监听用户点击消息
self.addEventListener('notificationclick' , function(e){
    var action = e.action;
    console.log(`action tag:${e.notification.tag}`,`action:${action}`,e);

    switch(action){
        case 'show-jd' : 
            console.log('show-jd');
            break;
        case 'contact-me' :
            console.log('contact-me');
            break;
        default :
            console.log(`未处理的action：${e.action}`);
            action = 'default';
            break;
    }
    

    e.waitUntil(
        self.clients.matchAll().then(function(clients){
            if(!clients || clients.length == 0){
                self.clients.openWindow && self.clients.openWindow('http://127.0.0.1:3034');
                return;
            }
            
            clients[0].focus && clients[0].focus();
            clients.forEach(function(client){
                client.postMessage(action);
            })
        })
    )

    e.notification.close();
})

class DealData{
    constructor(){
        this.tagDatas = {};
    }

    once(tag , callback){
        this.tagDatas[tag] || (this.tagDatas[tag] = []);
        this.tagDatas[tag].push(callback);
    }

    trigger(tag , data){
        this.tagDatas[tag] = this.tagDatas[tag] || [];
        let tagCallback ;
        while(tagCallback = this.tagDatas[tag].shift()){
            tagCallback(data)
        }
    }
}
const dealData = new DealData();

function openStore(storeName){
    return new Promise(function(resolve , reject){
        var request = indexedDB.open('PWA_DB' , 1);
        request.onerror = function(e){
            console.log('连接数据库失败')
        }
        request.onsuccess = function(e){
            console.log('连接数据库成功');
            resolve(e.target.result);
        }
    })
}


self.addEventListener('message' , function(e){
    var data = JSON.parse(e.data);
    var type = data.type;
    var msg = data.msg;

    console.log(`service worker收到消息 type: ${type} ; msg : ${JSON.stringify(msg)}`)

    dealData.trigger(type , msg);
})

//监听用户同步事件
self.addEventListener('sync' , function(e){
    console.log(`service worker需要进行后台同步，tag:${e.tag}`,e);

    var init = {
        method : 'GET'
    };

    if(e.tag === 'sample_sync'){
        var request = new Request(`/sync?name=xxx` , init);
        
        e.waitUntil(
            fetch(request).then(function(response){
                return response;
            })
        )
    }else if(e.tag === 'sample_sync_event'){
        let msgPromise = new Promise(function(resolve , reject){
            dealData.once('bgsync' , function(data){
                resolve(data)
            });
            setTimeout(resolve , 5000);
        })

        e.waitUntil(
            msgPromise.then(function(data){
                var name = data && data.name ? data.name : 'anonymous';
                var request = new Request(`sync?name=${name}` , init);
                return fetch(request)
            }).then(function(response){
                return response;
            })
        )
    }else if(e.tag === 'sample_sync_db'){
        var dbQueryPromise = new Promise(function(resolve , reject){
            var STORE_NAME = 'SyncData';
            openStore(e.tag).then(function(db){
                try{
                    var tx = db.transaction(STORE_NAME , 'readonly');
                    var store = tx.objectStore(STORE_NAME);
                    var dbRequest = store.get(e.tag);
                    dbRequest.onsuccess = function(e){
                        resolve(e.target.result);
                    }
                    dbRequest.onerror = function(err){
                        reject(err);
                    }
                }catch(err){
                    reject(err);       
                }
            })
        })
        e.waitUntil(
            dbQueryPromise.then(function(data){
                console.log(data);
                var name = data && data.name ? data.name : 'anonymous';
                var request = new Request(`sync?name=${name}` , init);
                return fetch(request);
            }).then(function(response){
                return response;
            })
        )
    }

    
})