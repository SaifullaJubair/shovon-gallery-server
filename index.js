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
    const qnaCollection = client.db("ShovonGallery").collection("qna");
    const wishListCollection = client
      .db("ShovonGallery")
      .collection("wishlist");

    app.get("/", async (req, res) => {
      console.log("Shovon's Gallery server is running");
      res.send("Server runing");
    });

    // ===== USER API START HERE ==== //

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

    // single user by email

    app.get("/singleuser/:e", async (req, res) => {
      const e = req.params.e;
      const query = { email: e };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // single user api update

    app.put("/edituser", async (req, res) => {
      const data = req.body;
      const filter = { email: data?.email };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          address: data?.address,
          mobileNumber: data?.mobileNumber,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send(result);
    });

    // Update user role from dashboard
    app.post("/users/update/:id", async (req, res) => {
      const id = req.params.id;
      const userRole = req.headers.role;
      const filter = { _id: new ObjectId(id) };
      // const option = { upsert: true };
      const updatedDoc = {
        $set: {
          role: userRole,
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // User delete from dashboard
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });

    // User Role Check api

    app.get("/users/checkBuyer", async (req, res) => {
      const query = { email: req.query.email };
      const user = await usersCollection.findOne(query);
      res.send({ isBuyer: user?.role === "user" });
    });

    app.get("/users/checkAdmin", async (req, res) => {
      const query = { email: req.query.email };
      const user = await usersCollection.findOne(query);
      // console.log(user, "ok");
      res.send({ isAdmin: user?.role === "admin" });
    });

    // ===== USER API END HERE ====== //

    //====== ALL PRODUCT API START HERE ======= //

    app.get("/products", async (req, res) => {
      const query = {};
      const products = await productCollection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
      res.send(products);
    });
    app.post("/products", async (req, res) => {
      const doc = req.body;
      const result = await productCollection.insertOne(doc);
      res.send(result);
    });

    // Single product

    app.get("/singleproduct/:id", async (req, res) => {
      const id = req.params.id;
      const result = await productCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Update Product
    app.patch("/update/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateFields = req.body;

      try {
        const result = await productCollection.updateOne(filter, {
          $set: updateFields,
        });
        res.json({
          acknowledged: result.acknowledged,
          modifiedCount: result.modifiedCount,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Delete Single Product

    app.delete("/singleproduct/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await productCollection.deleteOne(filter);
      res.send(result);
    });

    // ====== ALL PRODUCT API END HERE ======= //

    // ====== ALL CATEGORY API START HERE ======= //

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

    // ====== ALL CATEGORY API END HERE ======= //

    // ====== ALL WISH LIST API START HERE  ========== //

    // get a wishlist
    app.get("/wishlist/:id", async (req, res) => {
      const { id } = req.params;
      const { email } = req.query;
      const query = { productId: id, userEmail: email };
      const result = await wishListCollection.findOne(query);
      if (result === null) return res.send({ message: "There is no data" });
      return res.send(result);
    });
    // add wish list
    app.post("/add-wishlist", async (req, res) => {
      const wishItem = req.body;
      // console.log(req.body);
      const query = {
        userId: req.body.userId,
        userEmail: req.body.userEmail,
        productId: req.body.productId,
      };

      const alreadyAddedWishlist = await wishListCollection.findOne(query);

      if (alreadyAddedWishlist)
        return res.send({
          message: "This property already wishlisted",
        });

      const result = await wishListCollection.insertOne(wishItem);

      res.send(result);
    });

    // delete a wishlist
    app.delete("/wishlist/:id", async (req, res) => {
      const { id } = req.params;
      const { email } = req.query;
      const query = { productId: id, userEmail: email };
      const result = await wishListCollection.deleteOne(query);
      res.send(result);
    });
    // Delete MyWishlist
    app.delete("/mywishlist/:id", async (req, res) => {
      const { id } = req.params;
      const { email } = req.query;
      const query = { propertyId: id, userEmail: email };
      const result = await wishListCollection.deleteOne(query);
      res.send(result);
    });

    // Admin All Wishlist
    app.get("/wishlist", async (req, res) => {
      const wishlist = await wishListCollection
        .find()
        .sort({ createdAt: -1 })
        .toArray();
      res.send(wishlist);
    });

    // ======== ALL WISH LIST API End Here ======== //

    // ======== QnA API START HERE ====== //

    // all Qna get
    app.get("/allcomments/", async (req, res) => {
      const result = await qnaCollection
        .find()
        .sort({ createdAt: -1 })
        .toArray();
      res.send(result);
    });
    // ====== ALL QnA API END HERE ======= //

    // ====== ALL COMMENT API START HERE ======= //

    //comment get by id
    app.get("/comment/:id", async (req, res) => {
      const id = req.params.id;

      const query = { propertyId: id };
      const cursor = commentCollection.find(query).limit(10);
      const result = await cursor.sort({ createdAt: -1 }).toArray();
      res.send(result);
    });
    app.get("/comments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { email: id };
      const cursor = commentCollection.find(query);
      const result = await cursor.sort({ createdAt: -1 }).toArray();
      res.send(result);
    });
    // add comment post
    app.post("/addcomment", async (req, res) => {
      const comment = req.body;
      // console.log(comment);
      const result = await commentCollection.insertOne(comment);
      res.send(result);
    });

    //comment update by it
    app.put("/commentupdate/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const user = req.body;
      const option = { upsert: true };
      // console.log(user);
      // console.log(id);
      const updatedUser = {
        $set: {
          comment: user?.commentUpdate,
        },
      };
      const result = await commentCollection.updateOne(
        filter,
        updatedUser,
        option
      );
      // console.log(result);
      res.send(result);
      // console.log(updatedUser)
    });

    // comment delete by id
    app.delete("/comment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await commentCollection.deleteOne(filter);
      res.send(result);
    });

    // ====== ALL COMMENT API END HERE ======= //
  } finally {
  }
}
run().catch((error) => console.error(error));

app.listen(port, () => {
  console.log(`Shovon Gallery server is running on ${port}`);
});
