const dns = require("node:dns");
dns.setServers(["8.8.8.8", '8.8.4.4']);

const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { CLIENT_RENEG_LIMIT } = require("node:tls");
// const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dotenv.config()

const uri = process.env.MONGODB_URI;

const app = express()
const PORT = process.env.PORT

app.use(cors())
app.use(express.json())


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// const JWKS = createRemoteJWKSet(
//     new URL("http://localhost:3000/api/auth/jwks")
// );


const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("decoded:", decoded);

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Forbidden" });
    }
};


async function run() {
    try {
        await client.connect();

        const db = client.db("sportnest")
        const destinationCollection = db.collection("destination")
        const bookingCollection = db.collection("bookings")



        app.get("/destination", async (req, res) => {
            const result = await destinationCollection.find().toArray();
            res.json(result);
        })


        app.post('/destination', async (req, res) => {
            const destinationData = req.body
            console.log(destinationData)
            const result = await destinationCollection.insertOne(destinationData)

            res.json(result)
        })


        app.get("/destination/:id", verifyToken, async (req, res) => {
            const { id } = req.params

            const result = await destinationCollection.findOne({ _id: new ObjectId(id) })

            res.json(result)
        })


        app.patch("/destination/:id", async (req, res) => {
            const { id } = req.params
            const updateData = req.body

            const result = await destinationCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            )

            res.json(result)
        })


        app.delete("/destination/:id", async (req, res) => {
            const { id } = req.params

            const result = await destinationCollection.deleteOne(
                { _id: new ObjectId(id) }
            )

            res.json(result)
        })


        app.delete("/booking/:id", async (req, res) => {
            const { id } = req.params;

            const result = await bookingCollection.deleteOne({
                _id: new ObjectId(id),
            });

            res.json(result);
        });


        app.get("/booking/:userId", async (req, res) => {
            const { userId } = req.params;

            const result = await bookingCollection.find({ userId: userId }).toArray();

            res.json(result);
        });


        app.post('/booking', async (req, res) => {
            const dataBooking = req.body
            const result = await bookingCollection.insertOne(dataBooking)

            res.json(result)
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send("Server is running fine!")
})


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})