var send = {
    init : function(){
        this.sendClickFunc();
    },
    sendClickFunc : function(){
        var sendBtn = document.querySelector('.send'),
            _this = this;

        sendBtn.addEventListener('click' , function(e){
            var uniqueid = +document.querySelector('#uniqueid').value,
            message = document.querySelector('#message').value;

            if(uniqueid == 0 || uniqueid.length == 0){
                alert('请输入用户id');
                document.querySelector('#uniqueid').focus();
                return;
            }
            if(message == 0 || message.length == 0){
                alert('请输入推送的消息');
                document.querySelector('#message').focus();
                return;
            }
            
            _this.sendMessage(uniqueid,message);
            
        }, false)
    },
    sendMessage : function(uniqueid,message){
        var xhr = new XMLHttpRequest(),
            url = '/push',
            body = JSON.stringify({
                uniqueid,
                payload : message
            });

        xhr.timeout = 7000;
        xhr.onreadystatechange = function(){
            var res = {};
            if(xhr.readyState == 4 && xhr.status == 200){
                console.log(xhr)
            }
        }
        xhr.open('POST' , url ,true);
        xhr.setRequestHeader('Content-Type' , 'application/json');
        xhr.send(body);
    }
};
send.init();