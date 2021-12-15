const express = require('express');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/api', createProxyMiddleware({ target: 'https://www.blibli.com', changeOrigin: true }));

app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('Hello World!')
})

app.get('/backend', async (req, res) => {
    try {
        const data = await axios.get('https://www.blibli.com/backend/search/products?sort=&page=1&start=0&searchTerm=iphone&intent=true&merchantSearch=true&multiCategory=true&customUrl=&&channelId=mobile-web&showFacet=false&userIdentifier=536652622&isMobileBCA=false&userLatLong=-6.197754600000001%2C106.8242036&userLocationCity=Kota%20Jakarta%20Pusat%27');
        // const name = data.data.data.products[2].name   
        console.log('success: ', data.data.data)
        res.json(data.data.data)
    }
    catch(err) {
        console.log('failed')
        res.send(`${err.message}`)
    }
})

const port = process.env.PORT || 3000;
app.set('port', port);

app.listen(port, () => {
    console.log("server created on " + app.get('port'));
});