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
    const bannerImgCollection = client
      .db("ShovonGallery")
      .collection("bannerImg");
    const fixedImgCollection = client
      .db("ShovonGallery")
      .collection("fixedImg");
    const qnaCollection = client.db("ShovonGallery").collection("qna");
    const wishListCollection = client
      .db("ShovonGallery")
      .collection("wishlist");
    const cartCollection = client.db("ShovonGallery").collection("cart");

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
        .sort({ postDate: -1 })
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
        .sort({ postDate: -1 })
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

    // product show categories wise

    app.get("/category/:categoryName", async (req, res) => {
      const name = req.params.categoryName;
      if (name === "All") {
        const result = await productCollection.find({}).toArray();
        res.send(result);
      } else {
        const result = await productCollection
          .find({ category: name })
          .toArray();
        res.send(result);
      }
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

    // ====== ALL BANNER IMAGE API START HERE ======= //
    app.get("/allBannerImg", async (req, res) => {
      const result = await bannerImgCollection.find({}).toArray();
      res.send(result);
    });

    app.post("/addBannerImg", async (req, res) => {
      const data = req.body;
      const result = await bannerImgCollection.insertOne(data);
      res.send(result);
    });

    app.delete("/deleteBannerImg", async (req, res) => {
      const id = req.body._id;
      const filter = { _id: new ObjectId(id) };
      const result = await bannerImgCollection.deleteOne(filter);
      res.send(result);
    });

    app.put("/update/banner", async (req, res) => {
      const id = req.body._id;
      const name = req.body.name;
      const bannerImg = req.body.bannerImg;
      const status = req.body.status;
      const post_date = req.body.post_date;
      const filter = { _id: new ObjectId(id) };

      const updatedDoc = {
        $set: {
          name: name,
          bannerImg: bannerImg,
          status: status,
          post_date: post_date,
        },
      };

      try {
        const result = await bannerImgCollection.updateOne(filter, updatedDoc);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // ====== ALL BANNER IMAGE API END HERE ======= //

    // ====== ALL FIXED IMAGE API START HERE ======= //

    app.get("/allFixedImg", async (req, res) => {
      const result = await fixedImgCollection
        .find({})
        .sort({ postDate: -1 })
        .toArray();
      res.send(result);
    });

    app.post("/addFixedImg", async (req, res) => {
      const data = req.body;
      const result = await fixedImgCollection.insertOne(data);
      res.send(result);
    });

    app.delete("/deleteFixedImg", async (req, res) => {
      const id = req.body._id;
      const filter = { _id: new ObjectId(id) };
      const result = await fixedImgCollection.deleteOne(filter);
      res.send(result);
    });

    app.put("/update/fixedImg", async (req, res) => {
      const id = req.body._id;
      const name = req.body.name;
      const fixedImg = req.body.fixedImg;
      const status = req.body.status;
      const post_date = req.body.post_date;
      const filter = { _id: new ObjectId(id) };

      const updatedDoc = {
        $set: {
          name: name,
          fixedImg: fixedImg,
          status: status,
          post_date: post_date,
        },
      };

      try {
        const result = await fixedImgCollection.updateOne(filter, updatedDoc);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // ====== ALL BANNER IMAGE API END HERE ======= //

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

    // get my wishlist in dashboard

    app.get("/mywishlist/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { userEmail: email };
        const cursor = wishListCollection.find(query);
        const wishlist = await cursor.sort({ postDate: -1 }).toArray();

        // Extracting product IDs from the wishlist
        const productIds = wishlist.map((item) => item.productId);

        // Finding products that match the extracted product IDs
        const products = await productCollection
          .find({ _id: { $in: productIds.map((id) => new ObjectId(id)) } })
          .toArray();

        // Merging wishlist items with corresponding product details
        const mergedData = wishlist.map((item) => {
          const product = products.find(
            (product) => product._id.toString() === item.productId
          );
          return { ...item, product };
        });

        res.send(mergedData);
        // console.log(mergedData);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
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

    // Admin All Wishlist
    app.get("/wishlist", async (req, res) => {
      const wishlist = await wishListCollection
        .find()
        .sort({ postDate: -1 })
        .toArray();
      res.send(wishlist);
    });

    // ======== ALL WISH LIST API End Here ======== //

    // ALL CART API START HERE ===== //

    // get a cart
    app.get("/cart/:id", async (req, res) => {
      const { id } = req.params;
      const { email } = req.query;
      const query = { productId: id, userEmail: email };
      const result = await cartCollection.findOne(query);
      if (result) {
        res.json(result);
      } else {
        res.json({}); // Send an empty object if the product is not in the cart
      }
    });
    // get mycart in dashboard

    app.get("/mycart/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { userEmail: email };
        const cursor = cartCollection.find(query);
        const cart = await cursor.sort({ postDate: -1 }).toArray();

        // Extracting product IDs from the cart
        const productIds = cart.map((item) => item.productId);

        // Finding products that match the extracted product IDs
        const products = await productCollection
          .find({ _id: { $in: productIds.map((id) => new ObjectId(id)) } })
          .toArray();

        // Merging cart items with corresponding product details
        const mergedData = cart.map((item) => {
          const product = products.find(
            (product) => product._id.toString() === item.productId
          );
          return { ...item, product };
        });

        res.send(mergedData);
        // console.log(mergedData);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // add cart
    app.post("/add-cart", async (req, res) => {
      const cart = req.body;
      // console.log(req.body);
      const query = {
        userId: req.body.userId,
        userEmail: req.body.userEmail,
        productId: req.body.productId,
      };

      const alreadyAddedCart = await cartCollection.findOne(query);

      if (alreadyAddedCart)
        return res.send({
          message: "This product already added in your cart",
        });

      const result = await cartCollection.insertOne(cart);

      res.send(result);
    });

    // update cart quantity

    app.put("/cart/:id", async (req, res) => {
      const { id } = req.params;
      const { email } = req.query;
      const { quantity } = req.body;

      try {
        const query = { productId: id, userEmail: email };
        const updatedCart = await cartCollection.findOneAndUpdate(
          query,
          { $set: { quantity: quantity } },
          { returnDocument: "after" } // Returns the updated document
        );

        if (updatedCart.value) {
          res.json(updatedCart.value);
        } else {
          res.status(404).json({ error: "Cart item not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // delete a cart
    app.delete("/cart/:id", async (req, res) => {
      const { id } = req.params;
      const { email } = req.query;
      const query = { productId: id, userEmail: email };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });
    // ALL CART API END HERE ===== //

    // ======== QnA API START HERE ====== //

    // all Qna get
    app.get("/all-qna/:id", async (req, res) => {
      const id = req.params.id;
      const query = { product_id: id };
      const result = await qnaCollection
        .find(query)
        .sort({ postDate: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/dashboard/all-qna/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const cursor = qnaCollection.find(query);
        const qna = await cursor.sort({ postDate: -1 }).toArray();

        // Extracting product IDs from the QnA
        const productIds = qna.map((item) => item.product_id);

        // Finding products that match the extracted product IDs
        const products = await productCollection
          .find({ _id: { $in: productIds.map((id) => new ObjectId(id)) } })
          .toArray();

        // Merging cart items with corresponding product details
        const mergedData = qna.map((item) => {
          const product = products.find(
            (product) => product._id.toString() === item.product_id
          );
          // console.log("Item:", item);
          // console.log("Found Product:", product);
          return { ...item, product };
        });

        res.send(mergedData);
        // console.log(mergedData);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    app.post("/ask-question", async (req, res) => {
      const data = req.body;
      const result = await qnaCollection.insertOne(data);
      res.send(result);
    });

    app.delete("/delete-qna", async (req, res) => {
      const id = req.body._id;
      const userEmail = req.body.email; // Get user email from request body
      const filter = { _id: new ObjectId(id), email: userEmail }; // Add email to filter
      const result = await qnaCollection.deleteOne(filter);

      if (result.deletedCount === 1) {
        res.send({ success: true, message: "Delete successful" });
      } else {
        res
          .status(400)
          .send({ success: false, message: "Unauthorized or item not found" });
      }
    });

    app.put("/reply-question", async (req, res) => {
      const id = req.body._id;
      const reply = req.body.reply;
      const replyDate = req.body.replyDate;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          reply: reply,
          replyDate: replyDate,
        },
      };
      const result = await qnaCollection.updateOne(filter, updatedDoc, option);
      res.send(result);
    });
    app.put("/edit-question", async (req, res) => {
      const id = req.body._id;
      const question = req.body.question;
      const postDate = req.body.postDate;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          question,
          postDate,
        },
      };
      const result = await qnaCollection.updateOne(filter, updatedDoc, option);
      res.send(result);
    });
    // ====== ALL QnA API END HERE ======= //
  } finally {
  }
}
run().catch((error) => console.error(error));

app.listen(port, () => {
  console.log(`Shovon Gallery server is running on ${port}`);
});
