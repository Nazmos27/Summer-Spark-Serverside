const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000
require('dotenv').config()
// console.log(process.env.USER_NAME);


/**
 * ToDo : organize this index.js file 
 */


// midleware
app.use(cors())
app.use(express.json())

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ error: true, message: "Unathorized accsess" })
    }
    //if authorization work perfectly,their will be a token which will come in "bearer token" form
    const token = authorization.split(' ')[1]

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decodded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decodded = decodded;
        next()
    })
}


app.get('/', (req, res) => {
    res.send("Sever is Running")
})


// MongoDb 

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const classCollection = client.db('summerDB').collection('allClasses')
        const instructorCollection = client.db('summerDB').collection('allInstructors')
        const selectedClassCollection = client.db('summerDB').collection('selectedClasses')


        // Admin check middleware

        const verifyAdmin = async (req, res, next) => {
            const email = req.decodded.email
            const query = { email: email }
            const user = await userCollection.findOne(query)
            if (user?.role !== 'admin') {
                // return res.status(403).send({ error: true, message: "Forbidden Access" })
                //slightly modified to get instructor data from all user data
                const result = await userCollection.find({role: "instructor"}).toArray()
                return res.send(result)
            }
            next()
        }



        //json webtoken related APIs

        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '10h' })
            res.send({ token })
        })


        //user related API


        app.get('/users', verifyJWT,verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })
        // app.get('/users/instructors',verifyJWT,async(req,res) => {
        //     const role = req.query
        //     console.log(role);
        //     const query = {role:role}
        //     const result = await userCollection.find(query).toArray()
        //     console.log(result);
        //     res.send(result)
        // })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email
            // console.log('email geting ', email);
            // if(email !== req.decodded.email){
            //     res.send({admin:false})
            // }

            const query = { email: email }
            const user = await userCollection.findOne(query)
            const result = { role: user?.role }
            res.send(result)
        })

        app.post('/users', async (req, res) => {
            const user = req.body
            console.log(user);
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'User Already Exist' })
            }
            const result = await userCollection.insertOne(user)
            res.send(result)
        })


        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: "admin"
                },
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })
        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: "instructor"
                },
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })


        //Data fetching related API

        app.get('/allClasses', async (req, res) => {
            const result = await classCollection.find().toArray()
            res.send(result)
        })

        app.get('/myClasses', verifyJWT, async (req, res) => {
            let query = {}
            const email = req.query.email
            if (email) {
                query = { instructor_mail: email }
                const decoddedEmail = req.decodded.email
                if (email !== decoddedEmail) {
                    return res.status(403).send({ error: true, message: 'Forbidden Access' })
                }
                const result = await classCollection.find(query).toArray()
                res.send(result)
            }

        })

        app.get('/allInstructors', async (req, res) => {
            const result = await instructorCollection.find().toArray()
            res.send(result)
        })

        app.get('/selectedClasses', async (req, res) => {
            const email = req.query.email
            const query = { select_by: email }
            const result = await selectedClassCollection.find(query).toArray()
            res.send(result)

        })

        //Data Storing/Updating related API

        app.post('/selectedClasses', async (req, res) => {
            const selectedClass = req.body
            const result = await selectedClassCollection.insertOne(selectedClass)
            res.send(result)

        })

        app.post('/allClasses', async (req, res) => {
            const classData = req.body
            const result = await classCollection.insertOne(classData)
            res.send(result)
        })




        //create patment intent
        app.post('create-payment-intent' , async(req,res) => {
            const { price } = req.body;
            const amount = price*100
            const paymentIntent = await stripe.paymentIntents.create({
                amount:amount,
                currency:'usd',
                payment_method_types : ['card']
            })
            res.send({
                cleintSecret: paymentIntent.client_secret
            })
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







app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})