const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config()
// console.log(process.env.USER_NAME);
// 
// nazmos_12
// midleware
app.use(cors())
app.use(express.json())


app.get('/',(req,res) => {
    res.send("Sever is Running")
})


// MongoDb 

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.choi6e7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db('summerDB').collection('users')






//user related API


app.get('/users', async (req, res) => {
    const result = await userCollection.find().toArray()
    res.send(result)
})

app.post('/users', async (req, res) => {
    const user = req.body
    console.log(user);
    const query = {email : user.email}
    const existingUser = await userCollection.findOne(query)
    if(existingUser){
        return res.send({message : 'User Already Exist'})
    }
    const result = await userCollection.insertOne(user)
    res.send(result)
})
    







    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.listen(port,() => {
    console.log(`server is running on port ${port}`);
})