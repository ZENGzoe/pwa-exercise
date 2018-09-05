const Koa = require('koa'),
      koaStatic = require('koa-static'),
      Router = require('koa-router'),
      axios = require('axios'),
      cors = require('@koa/cors');

const app = new Koa(),
      router = new Router();

const port = process.env.PORT || 3034 ;

app.use(cors());
app.use(router.routes());

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

app.use(koaStatic(__dirname + '/public'));
app.listen(port , () => {
    console.log(`listen on port : ${port}`)
});

