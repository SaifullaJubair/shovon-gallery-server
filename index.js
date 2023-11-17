const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const SSLCommerzPayment = require("sslcommerz-lts");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const store_id = process.env.STORE_ID;
const store_password = process.env.STORE_PASSWORD;
const client_link = process.env.CLIENT_LINK;
const server_link = process.env.SERVER_LINK;
const is_live = false;

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
    const ordersCollection = client.db("ShovonGallery").collection("orders");
    const bangladeshCollection = client
      .db("ShovonGallery")
      .collection("bangladesh");
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
    const reviewCollection = client.db("ShovonGallery").collection("review");
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
      try {
        const query = {};
        const users = await usersCollection
          .find(query)
          .sort({ postDate: -1 })
          .toArray();
        res.send(users);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // user api post
    app.post("/adduser", async (req, res) => {
      try {
        const user = req.body;
        // console.log(user);
        const query = { email: req.body.email };
        const alreadyLoggedIn = await usersCollection.findOne(query);

        if (alreadyLoggedIn)
          return res.send({ message: "User already logged in!" });

        const result = await usersCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // single user by email

    app.get("/singleuser/:e", async (req, res) => {
      try {
        const e = req.params.e;
        const query = { email: e };
        const result = await usersCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // single user api update

    app.put("/edituser", async (req, res) => {
      try {
        const data = req.body;
        const filter = { email: data?.email };
        const option = { upsert: true };
        const updatedDoc = {
          $set: {
            name: data?.name,
            address: data?.address,
            mobileNumber: data?.mobileNumber,
            division: data?.division,
            district: data?.district,
            postDate: data.postDate,
          },
        };
        const result = await usersCollection.updateOne(
          filter,
          updatedDoc,
          option
        );
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Update user role from dashboard
    app.post("/users/update/:id", async (req, res) => {
      try {
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
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // User delete from dashboard
    app.delete("/users/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await usersCollection.deleteOne(filter);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // User Role Check api

    app.get("/users/checkBuyer", async (req, res) => {
      try {
        const query = { email: req.query.email };
        const user = await usersCollection.findOne(query);
        res.send({ isBuyer: user?.role === "user" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/users/checkAdmin", async (req, res) => {
      try {
        const query = { email: req.query.email };
        const user = await usersCollection.findOne(query);
        // console.log(user, "ok");
        res.send({ isAdmin: user?.role === "admin" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // ===== USER API END HERE ====== //

    //====== ALL PRODUCT API START HERE ======= //

    app.get("/products", async (req, res) => {
      try {
        const query = {};
        const products = await productCollection
          .find(query)
          .sort({ postDate: -1 })
          .toArray();
        res.send(products);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // All latest product api
    // Get latest product from each category using aggregation
    app.get("/latest-products-by-category", async (req, res) => {
      try {
        const latestProductsByCategory = await productCollection
          .aggregate([
            {
              $sort: { postDate: -1 }, // Sort products by postDate in descending order
            },
            {
              $group: {
                _id: "$category",
                latestProduct: { $first: "$$ROOT" }, // Get the first (latest) product in each category
              },
            },
            {
              $replaceRoot: { newRoot: "$latestProduct" }, // Replace the root document with the latest product in each category
            },
            {
              $limit: 4, // Limit the output to 4 documents
            },
          ])
          .toArray();

        res.json(latestProductsByCategory);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    /**
    * Alternative way to get latest product
      app.get("/latest-products-by-category", async (req, res) => {
      try {
        const categories = await categoriesCollection.find({}).toArray();
        const latestProductsByCategory = [];

        for (const category of categories) {
          const latestProduct = await productCollection
            .find({ category: category.name })
            .sort({ postDate: -1 })
            .limit(1)
            .toArray();

          if (latestProduct.length > 0) {
            latestProductsByCategory.push({
              latestProduct: latestProduct[0],
            });
          }
        }

        res.json(latestProductsByCategory);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    */

    app.post("/products", async (req, res) => {
      try {
        const doc = req.body;
        const result = await productCollection.insertOne(doc);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Single product

    app.get("/singleproduct/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await productCollection.findOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Update Product
    app.patch("/update/product/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateFields = req.body;
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
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await productCollection.deleteOne(filter);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // ====== ALL PRODUCT API END HERE ======= //

    // ====== ALL CATEGORY API START HERE ======= //

    // categories

    app.get("/allcategories", async (req, res) => {
      try {
        const result = await categoriesCollection.find({}).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // product show categories wise

    app.get("/category/:categoryName", async (req, res) => {
      try {
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
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // add categories
    app.post("/addcategory", async (req, res) => {
      try {
        const name = req.body.name;
        const data = {
          name: name,
        };
        const result = await categoriesCollection.insertOne(data);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // edit categories
    app.put("/editcategory", async (req, res) => {
      try {
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
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // delete categories
    app.delete("/deletecategory", async (req, res) => {
      try {
        const id = req.body._id;
        const filter = { _id: new ObjectId(id) };
        const result = await categoriesCollection.deleteOne(filter);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // ====== ALL CATEGORY API END HERE ======= //

    // ====== ALL BANNER IMAGE API START HERE ======= //
    app.get("/allBannerImg", async (req, res) => {
      try {
        const result = await bannerImgCollection.find({}).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post("/addBannerImg", async (req, res) => {
      try {
        const data = req.body;
        const result = await bannerImgCollection.insertOne(data);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.delete("/deleteBannerImg", async (req, res) => {
      try {
        const id = req.body._id;
        const filter = { _id: new ObjectId(id) };
        const result = await bannerImgCollection.deleteOne(filter);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.put("/update/banner", async (req, res) => {
      try {
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
      try {
        const result = await fixedImgCollection
          .find({})
          .sort({ postDate: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post("/addFixedImg", async (req, res) => {
      try {
        const data = req.body;
        const result = await fixedImgCollection.insertOne(data);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.delete("/deleteFixedImg", async (req, res) => {
      try {
        const id = req.body._id;
        const filter = { _id: new ObjectId(id) };
        const result = await fixedImgCollection.deleteOne(filter);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.put("/update/fixedImg", async (req, res) => {
      try {
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
      try {
        const { id } = req.params;
        const { email } = req.query;
        const query = { productId: id, userEmail: email };
        const result = await wishListCollection.findOne(query);
        if (result === null) return res.send({ message: "There is no data" });
        return res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
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
      try {
        const { id } = req.params;
        const { email } = req.query;
        const query = { productId: id, userEmail: email };
        const result = await wishListCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Admin All Wishlist
    app.get("/wishlist", async (req, res) => {
      try {
        const wishlist = await wishListCollection
          .find()
          .sort({ postDate: -1 })
          .toArray();
        res.send(wishlist);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // ======== ALL WISH LIST API End Here ======== //

    // ALL CART API START HERE ===== //

    // get a cart
    app.get("/cart/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { email } = req.query;
        const query = { productId: id, userEmail: email };
        const result = await cartCollection.findOne(query);
        if (result) {
          res.json(result);
        } else {
          res.json({}); // Send an empty object if the product is not in the cart
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
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
      try {
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
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // update cart quantity

    app.put("/cart/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { email } = req.query;
        const { quantity } = req.body;
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
      try {
        const { id } = req.params;
        const { email } = req.query;
        const query = { productId: id, userEmail: email };
        const result = await cartCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // ALL CART API END HERE ===== //

    // ======== QnA API START HERE ====== //

    // all Qna get
    app.get("/all-qna/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { product_id: id };
        const result = await qnaCollection
          .find(query)
          .sort({ postDate: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
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
      try {
        const data = req.body;
        const result = await qnaCollection.insertOne(data);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.delete("/delete-qna", async (req, res) => {
      try {
        const id = req.body._id;
        const userEmail = req.body.email; // Get user email from request body
        const filter = { _id: new ObjectId(id), email: userEmail }; // Add email to filter
        const result = await qnaCollection.deleteOne(filter);

        if (result.deletedCount === 1) {
          res.send({ success: true, message: "Delete successful" });
        } else {
          res.status(400).send({
            success: false,
            message: "Unauthorized or item not found",
          });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.put("/reply-question", async (req, res) => {
      try {
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
        const result = await qnaCollection.updateOne(
          filter,
          updatedDoc,
          option
        );
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    app.put("/edit-question", async (req, res) => {
      try {
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
        const result = await qnaCollection.updateOne(
          filter,
          updatedDoc,
          option
        );
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // ====== ALL QnA API END HERE ======= //
    // ====== ALL REVIEW API START HERE ======= //
    // single review for checking same product review or not
    app.get("/review/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { email } = req.query;
        const query = { productId: id, email: email };
        const result = await reviewCollection.findOne(query);
        if (result) {
          res.json(result);
          console.log(result);
        } else {
          res.json({}); // Send an empty object if the product is not in the review
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // all Review get
    app.get("/all-review/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { productId: id };
        const review = await reviewCollection
          .find(query)
          .sort({ postDate: -1 })
          .toArray();

        const userEmails = review.map((item) => item.email);
        const users = await usersCollection
          .find({ email: { $in: userEmails.map((e) => e) } })
          .toArray();
        const mergedData = review.map((item) => {
          const user = users.find((user) => user.email === item.email);
          return { ...item, user };
        });
        res.send(mergedData);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/myreview/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const cursor = reviewCollection.find(query);
        const review = await cursor.sort({ postDate: -1 }).toArray();

        // Extracting product IDs from the review
        const productIds = review.map((item) => item.productId);

        // Extracting user email from the review
        const userEmails = review.map((item) => item.email);

        // Finding products that match the extracted product IDs
        const products = await productCollection
          .find({ _id: { $in: productIds.map((id) => new ObjectId(id)) } })
          .toArray();
        const users = await usersCollection
          .find({ email: { $in: userEmails.map((e) => e) } })
          .toArray();

        // Merging review items with corresponding product details
        const mergedData = review.map((item) => {
          const product = products.find(
            (product) => product._id.toString() === item.productId
          );

          const user = users.find((user) => user.email === item.email);
          return { ...item, product, user };
        });

        res.send(mergedData);
        // console.log(mergedData);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // app.get("/dashboard/review/:email", async (req, res) => {
    //   try {
    //     const { email } = req.query;
    //     const query = { productId: id, email: email };
    //     const result = await reviewCollection.findOne(query);
    //     if (result) {
    //       res.json(result);
    //     } else {
    //       res.json({}); // Send an empty object if the product is not in the cart
    //     }
    //   } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ error: "Internal server error" });
    //   }
    // });

    app.post("/submit-review", async (req, res) => {
      try {
        const { productId, email, title, review, rating, postDate } = req.body;

        // Validate incoming data (you can add more validation logic as needed)
        if (!productId || !email || !review || !rating) {
          return res.status(400).json({ error: "Invalid data provided" });
        }
        const query = {
          email: email,
          productId: productId,
        };
        const alreadyAddedReview = await reviewCollection.findOne(query);
        if (alreadyAddedReview)
          return res.send({
            message:
              "Your review already submitted of this product, check your review in dashboard ",
          });
        console.log(alreadyAddedReview);
        // Create a new review object
        const productReview = {
          productId: productId,
          email: email,
          title: title,
          review: review,
          rating: rating,
          postDate: postDate,
        };

        const result = await reviewCollection.insertOne(productReview);
        res.send(result);
        console.log(result);

        // Respond with success message
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.delete("/delete-review", async (req, res) => {
      try {
        const id = req.body._id;
        const userEmail = req.body.email; // Get user email from request body
        const filter = { _id: new ObjectId(id), email: userEmail }; // Add email to filter
        const result = await reviewCollection.deleteOne(filter);

        if (result.deletedCount === 1) {
          res.send({ success: true, message: "Delete successful" });
        } else {
          res.status(400).send({
            success: false,
            message: "Unauthorized or item not found",
          });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.put("/edit-review", async (req, res) => {
      try {
        const { _id, productId, email, title, review, rating, postDate } =
          req.body;
        // console.log(productId, email, title, review, rating, postDate);
        const filter = { _id: new ObjectId(_id), email: email };

        if (!productId || !email || !review || !rating) {
          return res.status(400).json({ error: "Invalid data provided" });
        }
        const option = { upsert: true };
        const updatedDoc = {
          $set: {
            productId,
            email,
            title,
            review,
            rating,
            postDate,
          },
        };
        const result = await reviewCollection.updateOne(
          filter,
          updatedDoc,
          option
        );
        res.send(result);
        console.log(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // ====== ALL REVIEW API END HERE ======= //

    // ====== ALL BANGLADESH API START HERE ======= //
    app.get("/bangladesh", async (req, res) => {
      try {
        const query = {};
        const result = await bangladeshCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // ====== ALL BANGLADESH API END HERE ======= //
    // ====== ALL ORDER API START HERE ======= //
    app.post("/checkout", async (req, res) => {
      try {
        const order = req.body;

        const transactionId = new ObjectId().toString();
        const data = {
          total_amount: order.totalAmount,
          currency: "BDT",
          tran_id: transactionId, // use unique tran_id for each api call
          cus_name: order.userName,
          cus_email: order.userEmail,
          cus_add1: order.address,
          cartProducts: order.cartProducts,
          cus_city: order.district,
          cus_state: order.division,
          cus_phone: order.number,
          success_url: `${server_link}/payment/success?transactionId=${transactionId}&userEmail=${order.userEmail}`,
          fail_url: `${server_link}/payment/fail?transactionId=${transactionId}`,
          cancel_url: `${server_link}/payment/cancel`,
          ipn_url: "http://localhost:3030/ipn",
          shipping_method: "Courier",
          product_name: "Computer",
          product_category: "Electronic",
          product_profile: "general",
          cus_add2: "",
          cus_postcode: "",
          cus_country: "Bangladesh",
          cus_fax: "",
          ship_name: "Customer Name",
          ship_add1: "Dhaka",
          ship_add2: "Dhaka",
          ship_city: "Dhaka",
          ship_state: "Dhaka",
          ship_postcode: 1000,
          ship_country: "Bangladesh",
        };

        const sslcz = new SSLCommerzPayment(store_id, store_password, is_live);
        sslcz.init(data).then((apiResponse) => {
          // Redirect the user to payment gateway
          let GatewayPageURL = apiResponse.GatewayPageURL;
          // console.log(apiResponse);
          ordersCollection.insertOne({
            ...order,
            transactionId,
            paid: false,
            delivered: "Processing",
          });
          res.send({ url: GatewayPageURL });
        });
      } catch (error) {
        console.error("Error during checkout:", error);
        res
          .status(500)
          .json({ success: false, error: "Internal server error" });
      }
    });

    app.post("/payment/success", async (req, res) => {
      const { transactionId, userEmail } = req.query;
      // console.log(transactionId, userEmail);
      const currentDate = new Date();
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
        timeZone: "Asia/Dhaka",
      };
      const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
        currentDate
      );
      if (!transactionId) {
        return res.redirect(`${client_link}/payment/fail`);
      }
      const result = await ordersCollection.updateOne(
        { transactionId },
        { $set: { paid: true, paymentDate: formattedDate } }
      );
      if (result.modifiedCount > 0) {
        res.redirect(
          `${client_link}/payment/success?transactionId=${transactionId}`
        );

        const deleteCartResult = await cartCollection.deleteMany({
          userEmail: userEmail,
        });
      }
    });
    app.post("/payment/fail", async (req, res) => {
      const { transactionId } = req.query;
      if (!transactionId) {
        return res.redirect(`${client_link}/payment/fail`);
      }
      const result = await ordersCollection.deleteOne({ transactionId });
      if (result.deletedCount) {
        res.redirect(`${client_link}/payment/fail`);
      }
    });
    // Get checkout data by user email
    app.get("/orders/by-transaction-id/:id", async (req, res) => {
      try {
        const id = req.params.id;

        // Fetch checkout data based on user email
        const orders = await ordersCollection.findOne({ transactionId: id });

        if (!orders) {
          // If no checkout data found for the user, send a 404 response
          return res.status(404).json({ error: "Checkout data not found" });
        }

        res.json(orders);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/orders/:email", async (req, res) => {
      try {
        const userEmail = req.params.email;

        // Fetch checkout data based on user email
        const checkoutData = await ordersCollection
          .find({ userEmail })
          .sort({ paymentDate: -1 })
          .toArray();

        if (!checkoutData) {
          // If no checkout data found for the user, send a 404 response
          return res.status(404).json({ error: "Checkout data not found" });
        }

        res.send(checkoutData);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/all-orders", async (req, res) => {
      try {
        const query = {};
        const orders = await ordersCollection
          .find(query)
          .sort({ paymentDate: -1 })
          .toArray();
        res.send(orders);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.put("/update-delivery-status/:transactionId", async (req, res) => {
      try {
        const { transactionId } = req.params;
        const { delivered } = req.body;
        const query = { transactionId };
        const currentDate = new Date();
        const options = {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
          timeZone: "Asia/Dhaka",
        };
        const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
          currentDate
        );
        const updatedDeliveryStatus = await ordersCollection.findOneAndUpdate(
          query,
          { $set: { delivered: delivered, deliveredDate: formattedDate } },
          { returnDocument: "after" } // Returns the updated document
        );

        if (updatedDeliveryStatus.value) {
          res.json(updatedDeliveryStatus.value);
        } else {
          res.status(404).json({ error: "Order item not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // ====== ALL CHECKOUT API END HERE ======= //
  } finally {
  }
}
run().catch((error) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Shovon Gallery server is running on ${port}`);
});
