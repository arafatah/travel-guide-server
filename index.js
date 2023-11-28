const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
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
    const bookingCollection = client.db("travolDB").collection("booking");
    const userCollection = client.db("travolDB").collection("users");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middleware
    const verifyToken = (req, res, next) => {
      console.log("in ths token bar", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Forbidden request" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: "Invalid token" });
        }
        req.decoded = decoded;
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role === "Admin") {
        next();
      } else {
        return res.status(401).send({ message: "forbidden access" });
      }
    }

    // User section
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const userExist = await userCollection.findOne(query);
      if (userExist) {
        return res.send({ message: "User already exist", insertedId: null });
      } else {
        const result = await userCollection.insertOne(user);
        res.send({ message: "User created successfully", result });
      }
    });

    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      // console.log(req.headers);
      const cursor = userCollection.find({});
      const users = await cursor.toArray();
      res.send(users);
    });

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(401).send({ message: "Invalid token" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let Admin = false;
      if (user) {
        Admin = user?.role === "Admin";
      }
      res.send({ Admin });
    });

    app.get("/users/tourGuide/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(401).send({ message: "Invalid token" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let tourGuide = false;
      if (user) {
        tourGuide = user?.role === "Tour Guide";
      }
      res.send({ tourGuide });
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "Admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/users/guide/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "Tour Guide",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Booking section
    app.get("/booking", async (req, res) => {
      const cursor = bookingCollection.find({});
      const booking = await cursor.toArray();
      res.send(booking);
    });

    app.post("/booking", async (req, res) => {
      const newBooking = req.body;
      const result = await bookingCollection.insertOne(newBooking);
      res.send(result);
    });

    app.patch("/booking/accept/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "Approved",
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/booking/reject/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "Rejected",
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/booking/:touristEmail", async (req, res) => {
      const touristEmail = req.params.touristEmail;
      const query = { touristEmail: touristEmail };
      const booking = await bookingCollection.find(query).toArray();
      res.send(booking);
    });

    app.get("/booking/new/:selectedGuide", async (req, res) => {
      const selectedGuide = req.params.selectedGuide;
      const query = { selectedGuide: selectedGuide };
      const booking = await bookingCollection.find(query).toArray();
      res.send(booking);
    });

    // Package section
    app.get("/packages", async (req, res) => {
      const cursor = packageCollection.find({});
      const packages = await cursor.toArray();
      res.send(packages);
    });

    app.post("/packages", async (req, res) => {
      const newPackage = req.body;
      const result = await packageCollection.insertOne(newPackage);
      res.send(result);
    });

    app.get("/packages/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const packages = await packageCollection.findOne(query);
      res.send(packages);
    });

    app.post("/addToWishlist", async (req, res) => {
      const newWishList = req.body;
      const result = await wishListCollection.insertOne(newWishList);
      res.send(result);
    });

    // Wishlist section
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

    // Tour Guide section
    app.get("/tourGuide", async (req, res) => {
      const cursor = tourGuideCollection.find({});
      const tourGuide = await cursor.toArray();
      res.send(tourGuide);
    });

    app.get("/tourGuide/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const tourGuide = await tourGuideCollection.findOne(query);
      res.send(tourGuide);
    });

    app.get("/tourGuide/new/:name", async (req, res) => {
      const name = req.params.name;
      const query = { name: name };
      const tourGuide = await tourGuideCollection.findOne(query);
      res.send(tourGuide);
    });

    app.post("/tourGuide", async (req, res) => {
      const newTourGuide = req.body;
      const result = await tourGuideCollection.insertOne(newTourGuide);
      res.send(result);
    });

    // Story section
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

    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const review = await reviewCollection.findOne(query);
      res.send(review);
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
