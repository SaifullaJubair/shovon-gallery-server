const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xouf86z.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    //---------All collection here---------
    const usersCollection = client.db("ShovonGallery").collection("users");
    const productCollection = client.db("ShovonGallery").collection("products");
    const categoriesCollection = client
      .db("ShovonGallery")
      .collection("categories");

    app.get("/", async (req, res) => {
      console.log("Shovon's Gallery server is running");
      res.send("Server runing");
    });

    // user api get
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
      res.send(users);
    });

    // user api post
    app.post("/adduser", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const query = { email: req.body.email };
      const alreadyLoggedIn = await usersCollection.findOne(query);

      if (alreadyLoggedIn)
        return res.send({ message: "User already logged in!" });

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Add Product
    app.get("/products", async (req, res) => {
      const query = {};
      const products = await productCollection.find(query).toArray();
      res.send(products);
    });
    app.post("/products", async (req, res) => {
      const doc = req.body;
      const result = await productCollection.insertOne(doc);
      res.send(result);
    });

    // categories

    app.get("/allcategories", async (req, res) => {
      const result = await categoriesCollection.find({}).toArray();
      res.send(result);
    });

    // add categories
    app.post("/addcategory", async (req, res) => {
      const name = req.body.name;
      const data = {
        name: name,
      };
      const result = await categoriesCollection.insertOne(data);
      res.send(result);
    });
    // edit categories
    app.put("/editcategory", async (req, res) => {
      const id = req.body._id;
      const name = req.body.name;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          name: name,
        },
      };
      const result = await categoriesCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send(result);
    });

    // delete categories
    app.delete("/deletecategory", async (req, res) => {
      const id = req.body._id;
      const filter = { _id: new ObjectId(id) };
      const result = await categoriesCollection.deleteOne(filter);
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.error(error));

app.listen(port, () => {
  console.log(`Shovon Gallery server is running on ${port}`);
});
