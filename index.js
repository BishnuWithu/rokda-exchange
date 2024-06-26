const bodyParser = require('body-parser');
const express = require("express");
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 2404;

const userAgents = [
    'Mozilla/5.0 (Linux; Android 13; Pixel 6 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:53.0) Gecko/20100101 Firefox/53.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Mobile/15E148 Safari/604.1'
];
const headers = {
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
};

app.use(express.json());
// Endpoint for processing webpages
app.get("/webBuffer", (request, response) => {

    async function fetchStream() {
        try {
            let url = request.query.urlToFetch || "";
            Object.keys(request.query).forEach((key) => {

                if(key !=="urlToFetch"){
                    url = `${url}&${key}=${request.query[key]}`
                }     
            })
            console.log(`URL: ${url}`);
            console.log(`Headers: ${JSON.stringify(headers)}`);

            let responseFetched = await fetch(url, headers)
            console.log("streaming started-->")
            const streamReader = responseFetched.body.pipeThrough(new TextDecoderStream()).getReader();

            while(true){
                const {done, value} = await streamReader.read();
                if(done){
                    break;
                }
                console.log("> ..chunk received.. <")
                response.write(value)
            }
            console.log("<--streaming complete")
            response.end()
        }catch (error){
            console.error(`Error occured: ${error}`);
            response.status(500).send(`Error fetching the URL: ${url}`)
        }
    }
    fetchStream()
});

app.use(bodyParser.json());
// Endpoint for processing POST requests
app.post("/retrieve", async (request, response) => {
    try {
        const { url, payload } = request.body;
        const fetchedResponse = await axios.post(url, payload, {headers});
        const responseData = fetchedResponse.data;
        
        console.log(`URL: ${url}`);
        console.log(`Headers: ${JSON.stringify(headers)}`);

        return response.json(responseData);
    } catch (error) {
        console.error(`Error processing request: ${error}`);
        response.status(500).send(`Error processing the URL/Payload: ${error}`);
    }
});

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});