var searchNews = {
    init : function(){
        this.getSearch();
    },
    getSearch : function(){
        var searchBtn = document.querySelector('.J_searchBtn'),
            _this = this;
        searchBtn.addEventListener('touchend' , function(e){
            _this.queryNews();
        } , false)
    },
    queryNews : function(){
        var _this = this,
            xhr = new XMLHttpRequest(),
            newsName = document.querySelector('#input').value;
            url = '/news?q=' + newsName;
        
        if(newsName === ''){
            alert('请输入想要了解的新闻');
            return;
        }

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
                console.log(res);
                if(res.data.length == 0){
                    alert('搜索无结果！')
                }else{
                    _this.fillNews(res.data)
                }
            }
        }
        xhr.open('GET',url,true);
        xhr.send(null);

    },
    fillNews : function(data){
        var _html = '';
        data.map(function(item,i){
            var img = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : 'img/white.jpg';
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