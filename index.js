const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
const { ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dokkyfc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const packageCollection = client.db("travolDB").collection("packages");
    const wishListCollection = client.db("travolDB").collection("wishList");
    const tourGuideCollection = client.db("travolDB").collection("tourGuide");
    const reviewCollection = client.db("travolDB").collection("review");

    app.get("/packages", async (req, res) => {
      const cursor = packageCollection.find({});
      const packages = await cursor.toArray();
      res.send(packages);
    });

    app.post("/addToWishlist", async (req, res) => {
      const newWishList = req.body;
      const result = await wishListCollection.insertOne(newWishList);
      res.send(result);
    });

    app.get("/wishlist/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const wishList = await wishListCollection.find(query).toArray();
      res.send(wishList);
    });

    app.delete("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishListCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/wishlist", async (req, res) => {
      const cursor = wishListCollection.find({});
      const wishList = await cursor.toArray();
      res.send(wishList);
    });

    app.get("/wishlist/new/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const wishList = await wishListCollection.findOne(query);
      res.send(wishList);
    });

    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const review = await reviewCollection.findOne(query);
      res.send(review);
    });

    app.get("/tourGuide", async (req, res) => {
      const cursor = tourGuideCollection.find({});
      const tourGuide = await cursor.toArray();
      res.send(tourGuide);
    });

    app.post("/tourGuide", async (req, res) => {
      const newTourGuide = req.body;
      const result = await tourGuideCollection.insertOne(newTourGuide);
      res.send(result);
    });

    app.get("/review", async (req, res) => {
      const cursor = reviewCollection.find({});
      const review = await cursor.toArray();
      res.send(review);
    });

    app.post("/review", async (req, res) => {
      const newReview = req.body;
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
