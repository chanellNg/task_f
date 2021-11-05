let axios = require("axios");
let cors = require("cors");
let express = require("express");
let redis = require("redis");

const app = express();
const client = redis.createClient({
    host: 'localhost',
    port: '8081'
  });

client.on("error", (err) => {
    console.log(err);
})

app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/jobs', (req, res) => {
    let startTime = new Date();
    let finishTime;
    const albumId = req.query.albumId;
    try {
        client.get(albumId, async (err, jobs) => {
            if (err) {
                throw err;
            }
    
            if (jobs) {
                finishTime = new Date();
                var timeTaken = Math.abs(finishTime.getTime() - startTime.getTime()); // in miliseconds
                res.status(200).send({
                    jobs: JSON.parse(jobs),
                    message: `Data retrieved from the cache. It took ${timeTaken} ms`
                });
                console.log(`Data retrieved from the cache. It took ${timeTaken} ms`);
            }
            else {
                const jobs = await axios.get("http://jsonplaceholder.typicode.com/photos", {params: {albumId}});
                finishTime = new Date();
                var timeTaken = Math.abs(finishTime.getTime() - startTime.getTime()); // in miliseconds
                client.setex(albumId, 3600, JSON.stringify(jobs.data));
                res.status(200).send({
                    jobs: jobs.data,
                    message: `Cache miss. It took ${timeTaken} ms.`
                });
                console.log( `Cache miss. It took ${timeTaken} ms.`);
            }
        });
    } catch(err) {
        res.status(500).send({message: err.message});
    }
});

// Setup server port
var port = process.env.PORT || 8080;

app.listen(port, function () {
        console.log("Running on port " + port);
});