var searchNews = {
    init : function(){
        this.getSearch();
    },
    getSearch : function(){
        var searchBtn = document.querySelector('.J_searchBtn'),
            _this = this;
        searchBtn.addEventListener('touchend' , function(e){
            document.querySelector('.J_loading').style.display = "block";
            _this.queryNews();
        } , false)
    },
    queryNews : function(){
        var _this = this,
            newsName = document.querySelector('#input').value;
            url = '/news?q=' + newsName;
        
        if(newsName === ''){
            alert('请输入想要了解的新闻');
            return;
        }
        var fetchData = _this.fetchNewsApi(url);
        var cacheData;
        _this.getDataFromCache(url).then(function(data){
            if(data && data.data &&  data.data.length > 0){
                _this.fillNews(data.data)
            }
            cacheData = data || {};
            return fetchData;
        }).then(function(data){
            if(JSON.stringify(data) !== JSON.stringify(cacheData)){
                _this.fillNews(data.data)
            }
        }).catch(function(err){
            console.log(err);
        }) 
    },
    fetchNewsApi : function(url){
        return new Promise(function(resolve,reject){
            var xhr = new XMLHttpRequest();
            xhr.timeout = 70000;
            xhr.onreadystatechange = function () {
                var res = {};
                if(xhr.readyState == 4 && xhr.status == 200){
                    try{
                        res = JSON.parse(xhr.responseText)
                    }
                    catch(e){
                        res = xhr.responseText;
                    }
                    resolve(res);
                    
                    
                }else if(xhr.readyState == 4){
                    reject()
                }
            }
            xhr.onerror = reject;
            xhr.ontimeout = reject;
            xhr.open('GET',url,true);
            xhr.send(null);
        })
    },
    getDataFromCache : function(url){
        if('caches' in window){
            return caches.match(url).then(function(cache){
                if(!cache || cache.responseText == 'Not Found'){
                    return;
                }
                return cache.json();
            })
        }else{
            return Promise.resolve();
        }
    },
    fillNews : function(data){
        document.querySelector('.J_loading').style.display = "none";

        var _html = '';
        data.map(function(item,i){
            var img = item.imageUrls && item.imageUrls.length > 0 && item.imageUrls[0].indexOf('so.qhimg.com') == -1 ? item.imageUrls[0] : 'img/white.jpg';
            _html += [
                '<a class="list" href="' + item.url + '" target="_blank">',
                    '<span class="pic"><img src="' + img + '" alt="' + item.title + '"></span>',
                    '<span class="title">' + item.title + '</span>',
                '</a>'
                ].join('');
        })
        document.querySelector('.J_content').innerHTML = _html;
    }
}
searchNews.init();

//向push service订阅消息推送
function subscribeUserToPush(registration , publicKey){
    var subscribeOptions = {
        userVisibleOnly : true,
        applicationServerKey : window.urlBase64ToUint8Array(publicKey)
    };

    return registration.pushManager.subscribe(subscribeOptions).then(function(pushSubscription){
        console.log('pushscription' ,pushSubscription)
        return pushSubscription;
    })
}

//向服务器发送subscription
function sendSubscriptionToServer(body){
    var url = '/subscription';
    return new Promise(function(resolve , reject){
        var xhr = new XMLHttpRequest();
        xhr.timeout = 7000;
        xhr.onreadystatechange = function(){
            var response = {};
            if(xhr.readyState == 4 && xhr.status == 200){
                try{
                    response = JSON.parse(xhr.responseText);
                }catch(e){
                    response = xhr.responseText
                }
                resolve(response)
            }else if(xhr.readyState == 4){
                resolve();
            }
        }
        xhr.onabort = reject;
        xhr.onerror = reject;
        xhr.ontimeout = reject;
        xhr.open('POST' , url , true);
        xhr.setRequestHeader('Content-Type' , 'application/json');
        xhr.send(body)
    })
}

function askPermission(){
    return new Promise(function(resolve , reject){
        var permissionResult = Notification.requestPermission(function(result){
            resolve(result);
        })
        if(permissionResult){
            permissionResult.then(resolve , reject);
        }
    }).then(function(permissionResult){
        console.log('permissionResult:',permissionResult)
        if(permissionResult !== 'granted'){
            throw new Error('We weren\'t granted permission.');
        }
    })
}

function openStore(storeName){
    return new Promise(function(resolve , reject){
        if(!('indexedDB' in window)){
            retject('don\'t support indexedDB')
        }

        var request = indexedDB.open('PWA_DB' , 1);
        request.onerror = function(e){
            console.log('连接数据库失败');
            reject(e);
        }
        request.onsuccess = function(e){
            console.log('连接数据库成功');
            resolve(e.target.result);
        }
        request.onupgradeneeded = function(e){
            console.log('数据库版本升级',e);
            var db = e.srcElement.result;
            if(e.oldVersion === 0){
                if(!db.objectStoreNames.contains(storeName)){
                    var store = db.createObjectStore(storeName , {
                        keyPath : 'tag'
                    });
                    store.createIndex(storeName + 'Index' , 'tag' , {unique : false});
                    console.log('创建索引成功')
                }
            }
        }
    })
}

navigator.serviceWorker.addEventListener('message', function(e){
    var action = e.data;
    console.log(`receive post-message from sw , action is ${e.data}`);
    switch(action){
        case 'show-jd' :
            location.href = 'https://www.jd.com';
            break;
        case 'contact-me' :
            location.href = 'mailto:563282341@qq.com';
            break;
        default :
            document.querySelector('.tips').style.display = 'block';
            break;
    }
})
var STORE_NAME = 'SyncData';
if('serviceWorker' in navigator && 'SyncManager' in window){
    navigator.serviceWorker.ready.then(function(registration){
        var tag = "sample_sync";
        document.querySelector('.J_sync').addEventListener('click' , function(){
            console.log('同步后台',registration.sync)
    
            registration.sync.register(tag).then(function(){
                console.log('同步后台已触发',tag);
            }).catch(function(err){
                console.log('后台同步出发失败',err);
            })
        })
    })

    navigator.serviceWorker.ready.then(function(registration){
        var tag = 'sample_sync_event';
        
        document.querySelector('.J_sync_event').addEventListener('click', function(e){
            registration.sync.register(tag).then(function(){
                console.log(`后台同步已触发：${tag}`);

                var inputValue = document.querySelector('#input').value;
                var msg = JSON.stringify({ type : 'bgsync' , msg : {name : inputValue}});
                navigator.serviceWorker.controller.postMessage(msg);
            }).catch(function(err){
                console.log(`后台同步触发失败：${err}`)
            })
            
        })
    })

    navigator.serviceWorker.ready.then(function(registration){
        return Promise.all([
            openStore(STORE_NAME),
            registration
        ]).then(function(result){
            var db = result[0];
            var registration = result[1];
            var tag = 'sample_sync_db';

            document.querySelector('.J_sync_db').addEventListener('click', function(e){

                var inputValue = document.querySelector('#input').value;
                var tx = db.transaction(STORE_NAME , 'readwrite');
                var store = tx.objectStore(STORE_NAME);
                var item = {
                    tag : tag ,
                    name : inputValue
                }
                store.put(item);

                registration.sync.register(tag).then(function(){
                    console.log(`后台同步已触发：${tag}`);
                }).catch(function(err){
                    console.log(`后台触发失败：${err}`);
                })
            })
        })
    })
}


if('serviceWorker' in navigator && 'PushManager' in window){
    var publicKey = 'BBP3Ni05GCu_RTb7rAkOqfFPiDQkNhcAfOAhqxpaxmuKLhF3DYTldbl3vrmfTfHSHhCBXPgKhQXexEmDLLqV1sQ';

    navigator.serviceWorker.register('./serviceWorker.js?'+Math.random().toString(6).substr(2) , { scope : '/'}).then(function(registration){
        return Promise.all([
            registration,
            askPermission()
        ])
    }).then(function(result){
        console.log('registerResult:',result)

        var registration = result[0];
        
        document.querySelector('.J_notification').addEventListener('click',function(e){
            var title = 'PWA学习PWA学习PWA学习PWA学习PWA学习PWA学习PWA学习PWA学习PWA学习PWA学习';
            var options = {
                body : '邀请你一起学习,邀请你一起学习邀请你一起学习邀请你一起学习邀请你一起学习邀请你一起学习邀请你一起学习邀请你一起学习邀请你一起学习邀请你一起学习邀请你一起学习邀请你一起学习邀请你一起学习邀请你一起学习邀请你一起学习邀请你一起学习',
                icon : '/img/icon_128.png',
                actions : [{
                    action : 'show-jd',
                    title : '去京东',
                },{
                    action : 'contact-me',
                    title : '联系我',
                }],
                tag : 'pwa-starter',
                renotify : true
            };
            registration.showNotification(title,options)
        })

        console.log('service worker注册成功'); 
        return subscribeUserToPush(registration,publicKey)
    }).then(function(subscription){
        var body = {subscription : subscription};

        body.uniqueid = new Date().getTime();
        console.log('uniqueid' , body.uniqueid);

        return sendSubscriptionToServer(JSON.stringify(body));
    }).then(function(res){
        console.log(res)
    }).catch(function(e){
        console.log(e)
    })
}

