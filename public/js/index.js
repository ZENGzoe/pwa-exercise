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


if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./serviceWorker.js?'+Math.random().toString(6).substr(2) , { scope : '/'}).then(function(){
        console.log('service worker注册成功');
    })
}