const Koa = require('koa'),
      koaStatic = require('koa-static'),
      Router = require('koa-router'),
      axios = require('axios'),
      cors = require('@koa/cors'),
      webpush = require('web-push'),
      koaBody = require('koa-body'),
      util = require('./util');

const app = new Koa(),
      router = new Router();

const port = process.env.PORT || 3034 ;

app.use(cors());
app.use(router.routes());

// console.log(webpush.generateVAPIDKeys());

var vapidKeys = {
    privateKey:"9mHKxhF60T4iApR4f4dDKtdXL8PK5dj3TfDBAK8iufI",
    publicKey:"BBP3Ni05GCu_RTb7rAkOqfFPiDQkNhcAfOAhqxpaxmuKLhF3DYTldbl3vrmfTfHSHhCBXPgKhQXexEmDLLqV1sQ"
}

webpush.setVapidDetails(
    'mailto:563282341@qq.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
)

router.get('/news' , async (ctx , next) => {
    try{
        const apiKey = 'WzQYMKDI6TTP3aa7VHMfiW81ekhEoP1UzjGj81Aep3bhH77Cg65Y38dWZRRfUgnn';
        let query = ctx.request.query,
            { q } = query,
            url = encodeURI(`http://api01.bitspaceman.com:8000/news/qihoo?apikey=${apiKey}&kw=${q}`),
            res = await axios.get(url);

        ctx.response.body = res.data;
    }
    catch(e){
        console.log(e)
    }
})

//提交subscription接口
router.post('/subscription' , koaBody() , async ctx => {
    let body = ctx.request.body;
    await util.saveRecord(body);
    ctx.response.body = {
        status : 0
    }
})

//推送消息接口
router.post('/push' , koaBody() , async ctx => {
    let { uniqueid , payload } = ctx.request.body;
    let list = uniqueid ? await util.find({uniqueid}) : await util.findAll();
    let status = list.length > 0 ? 0 : -1;

    for(let i = 0 ; i < list.length ; i++){
        let subscription = list[i].subscription;
        pushMessage(subscription , JSON.stringify(payload));
    }

    ctx.response.body = {
        status
    }
})

router.get('/sync' , async (ctx , next) => {
    console.log(`Hello ${ctx.request.query.name} , I have receiced your msg`);
    ctx.response.body = {
        status : 0
    }
})


//向push service推送消息
const options = {
    
};
function pushMessage(subscription , data = {}){
    webpush.sendNotification(subscription , data , options).then(data => {
        console.log('push service的相应数据' , JSON.stringify(data));
        return;
    }).catch(err => {
        //410和404表示失败
        if(err.statusCode === 410 || err.statusCode === 404){
            console.log(err);
            return util.remove(subscription)
        }else{
            console.log(subscription);
            console.log(err);
        }
    })
}

app.use(koaStatic(__dirname + '/public'));
app.listen(port , () => {
    console.log(`listen on port : ${port}`)
});

