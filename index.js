const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000
const app = express();
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId, Admin } = require('mongodb');
require('dotenv').config();

const verifyToken = require('./verifyToken'); 





// middleware set

app.use(cors());

app.use(express.json());




// mongo db




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fkw47.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        // all collection

        const UserCollection = client.db('North_South_Express').collection('users');
        const parcelCollection = client.db('North_South_Express').collection('parcels');




        // jwt related api

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            })
            res.send({ token })
        })



        // admin panel related api 

        // get user role

        app.get('/users/role/:email', async (req, res) => {
            const email = req.params.email
            const result = await UserCollection.findOne({ email })

            res.send({ role: result?.role })
        })






        // users api

        app.post('/users', async (req, res) => {
            const user = req.body;
            // insert email if user doesnt exist

            const query = { email: user.email };
            const existingUser = await UserCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exist', insertedId: null });
            }

            const result = await UserCollection.insertOne({ ...user, role: 'user' });

            res.send(result);
        })

        // get all user

        app.get('/users', async (req, res) => {
            const email = req.query.email;
            console.log('Recevided eamil', email);
            let query = {};
            if (email) {
                query = { email: email };
            }
            const result = await UserCollection.find(query).toArray();
            res.send(result)
        })


        // update user profile

        app.put('/user', async (req, res) => {
            const email = req.query.email;
            const updatedData = req.body;

            const allowedFields = ['photoURL'];
            const filteredData = Object.keys(updatedData)
                .filter(key => allowedFields.includes(key))
                .reduce((obj, key) => {
                    obj[key] = updatedData[key];
                    return obj;
                }, {});

            const result = await UserCollection.updateOne(
                { email },
                { $set: filteredData }
            );
            res.send(result);

        });








        // user role patch

        app.patch('/user/admin/:id', async (req, res) => {
            const { role } = req.body;

            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = { $set: { role: role } };

            try {
                const result = await UserCollection.updateOne(filter, updatedDoc);
                if (result.modifiedCount > 0) {
                    res.send({ message: 'Role updated successfully', modifiedCount: result.modifiedCount });
                } else {
                    res.status(404).send({ message: 'User not found or role unchanged' });
                }
            } catch (error) {
                res.status(500).send({ message: 'Error updating role', error });
            }
        });






        // user parcels create

        // parcel post

        app.post('/parcels', async (req, res) => {
            const parcel = req.body;
            const result = await parcelCollection.insertOne(parcel);
            res.send(result);

        })

        // parcel get


        app.get('/parcels', async (req, res) => {
            const email = req.query.email;
            let query = {};
            if (email) {
                query = { email: email };
            }
            const allparcels = await parcelCollection.find(query).toArray();
            res.send(allparcels);
        });


        // id wise parcel data update

        
        app.patch('/parcels/:id', async (req, res) => {
            const { id } = req.params;
            const { status, deliveryman, deliverymanId, deliverymanemail, appxdeliveryDate } = req.body;

            try {
                const updatedParcel = await parcelCollection.updateOne(
                    { _id: ObjectId(id) },
                    {
                        $set: {
                            status,
                            appxdeliveryDate,
                            deliveryman,
                            deliverymanId,
                            deliverymanemail,
                        },
                    }
                );

                if (updatedParcel.modifiedCount > 0) {
                    res.status(200).json({ modifiedCount: updatedParcel.modifiedCount });
                } else {
                    res.status(400).json({ message: 'Failed to update the parcel.' });
                }
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Server error' });
            }
        });



        // review patch

        // Update parcel with review data


        app.patch('/parcelsreview/:id', async (req, res) => {
            const id = req.params.id;
            let { reviewStar, reviewComment, reviewDate } = req.body;

        
            reviewStar = Number(reviewStar);

            if (isNaN(reviewStar) || reviewStar < 1 || reviewStar > 5) {
                return res.status(400).send({ message: 'Invalid review star ' });
            }

            try {
                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: {
                        reviewStar,
                        reviewComment,
                        reviewDate,
                    },
                };

                const result = await parcelCollection.updateOne(filter, updateDoc);

                res.send(result);
            } catch (error) {
                res.status(500).send({ message: 'Error updating review', error });
            }
        });



        //  get id wise user parcel update

        app.get('/parcel/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await parcelCollection.findOne(query);
            res.send(result);
        })

        // id wise user pacelse update patch

        app.put('/parcel/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateParcelDoc = req.body;

            // akhane update parcel doc a data set kora holo

            const TutorDoc = {
                $set: {

                    Phonenumber: updateParcelDoc.Phonenumber,
                    parcelType: updateParcelDoc.parcelType,
                    parcelWeight: updateParcelDoc.parcelWeight,
                    recivername: updateParcelDoc.recivername,
                    ReciverPhone: updateParcelDoc.ReciverPhone,
                    deliveryAddress: updateParcelDoc.deliveryAddress,
                    timestamp: updateParcelDoc.timestamp,
                    deliveryLititude: updateParcelDoc.deliveryLititude,
                    deliveryLongitude: updateParcelDoc.deliveryLongitude,
                    price: updateParcelDoc.price,

                },
            };

            const result = await parcelCollection.updateOne(filter, TutorDoc, options);
            res.send(result);
        });






        // delete parcel

        app.delete('/parcels/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await parcelCollection.deleteOne(query);
            res.send(result);
        })


        // email wise deliverymen parcel get

        app.get('/deliverymen/parcels', async (req, res) => {
            const { email } = req.query;
            let filter = {};
            if (email) {
                filter.deliverymanemail = email;
            }
            const parcels = await parcelCollection.find(filter).toArray();
            console.log('Parcels fetched:', parcels);
            res.send(parcels)
        });



        // role wise all delivery men filter

        app.get('/users/deliverymen', async (req, res) => {
            const query = { role: "deliveryman" };
            const filter = await UserCollection.find(query).toArray();
            res.send(filter);
        })





        // count parcle

        app.get('/parcels/count-user', async (req, res) => {

            const result = await parcelCollection.aggregate([

                {
                    $group: {
                        _id: "$email",
                        totalParcels: { $sum: 1 },
                    }
                },
                {
                    $project: {
                        email: '$_id',
                        totalParcels: 1,
                        _id: 0
                    }
                }

            ]).toArray();

            // fetch all user detail

            const users = await UserCollection.find({}).toArray();

            // add parcel count in user deatils

            const userwithparcel = users.map((user) => {
                const parcelInfo = result.find(parcel => parcel.email === user.email);
                return {
                    ...user, totalParcels: parcelInfo ? parcelInfo.totalParcels : 0
                };
            });

            // update eatch user with totalprice field
            const updateUsercollection = userwithparcel.map(async (user) => {

                await UserCollection.updateOne(
                    { email: user.email },
                    {
                        $set: {
                            totalParcels: user.totalParcels
                        }
                    }
                )

            });


            // Wait for all update operations to complete
            await Promise.all(updateUsercollection);

            // Respond with the updated user data
            res.send({
                message: "User parcel data updated successfully",
                updatedUsers: userwithparcel,
            });

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








app.get('/', (req, res) => {
    res.send('Sarver Successfully Running')
})


app.listen(port, () => {
    console.log(`Server is running is port ${port}`)
})