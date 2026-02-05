const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const admin = require("firebase-admin");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }

    // console.log(token);
    req.decoded = decoded;
    console.log(req.decoded);

    next();
  });
};

const serviceAccount = require("./job-portal-9e852-firebase-adminsdk-fbsvc-91e93ae634.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// firebaseToken verifyToken;

const firebaseVerifyToken = async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  console.log(token);

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const userInfo = await admin.auth().verifyIdToken(token);

  req.tokenEmail = userInfo.email;

  next();

  // console.log("inside firebase token", userInfo);
};

// mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jvuz9id.mongodb.net/?appName=Cluster0`;

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
    const jobsCollection = client.db("jobPortal").collection("jobs");
    const applicationsCollection = client
      .db("jobPortal")
      .collection("applications");

    // jsonwebtoken
    app.post("/jwt", (req, res) => {
      const userData = req.body;
      const token = jwt.sign(userData, process.env.JWT_SECRET_KEY, {
        expiresIn: "1h",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000, //
      });
      res.send({ success: true });
    });

    // app.post("/jwt", (req, res) => {
    //   const { email } = req.body;
    //   const user = { email };
    //   // console.log(userInfo);

    //   const token = jwt.sign(user, process.env.JWT_SECRET_KEY, {
    //     expiresIn: "1h",
    //   });

    //   res.cookie("accessToken", token, {
    //     httpOnly: true,
    //     secure: false,
    //     sameSite: "lax",
    //     maxAge: 60 * 60 * 1000,
    //   });

    //   res.send({ success: true });
    // });

    // get jobs

    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      // console.log(email);
      const query = {};
      if (email) {
        query.hr_email = email;
      }
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });

    // get by id
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // post

    app.post("/jobs", async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });

    // jobs end

    // job applications

    // get

    app.get("/applications", firebaseVerifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { email: email };

      if (email !== req.tokenEmail) {
        return res.status(403).send({ message: "forbidden" });
      }
      // if (email !== req.decoded.email) {
      //   return res.status(403).send({ message: "forbidden" });
      // }
      const result = await applicationsCollection.find(query).toArray();
      console.log("inside application api", req.cookies);

      // eta hoche data arek collection er document theke ana, eta valo way na,
      for (let application of result) {
        const id = application.jobId;
        const query = { _id: new ObjectId(id) };
        const job = await jobsCollection.findOne(query);
        application.company = job.company;
        application.title = job.title;
        application.company_logo = job.company_logo;
      }
      res.send(result);
    });

    app.get("/applications/job/:id", async (req, res) => {
      const jobId = req.params.id;
      const query = { jobId: jobId };

      const result = await applicationsCollection.find(query).toArray();

      res.send(result);
    });

    // post data for job applicants

    app.post("/applications", async (req, res) => {
      const applications = req.body;
      const result = await applicationsCollection.insertOne(applications);
      // console.log(applications);
      res.send(result);
    });

    app.patch("/applications/:id", async (req, res) => {
      const id = req.params.id;
      const updated = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDocs = {
        $set: {
          status: updated.status,
        },
      };
      console.log(filter, updatedDocs);

      const result = await applicationsCollection.updateOne(
        filter,
        updatedDocs,
      );
      res.send(result);
    });

    // get data for job applications by applicants

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.listen(port, () => {
  console.log(`server is running to ${port}`);
});
