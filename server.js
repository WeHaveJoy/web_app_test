// Require Express
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const passport = require('passport');
const session = require('express-session');
const bcrypt = require('bcrypt');
const initializePassport = require('./passport-config');


// Create an instance of Express
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(bodyParser.json());

// Middleware to handle CORS
app.use(cors());

// Middleware for sessions
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
  }));
  
  // Initialize Passport
initializePassport(passport, 
    email => db.collection('users').findOne({ email: email }), 
    id => db.collection('users').findOne({ _id: new ObjectId(id) })
  );
  app.use(passport.initialize());
  app.use(passport.session());

// MongoDB connection URI and Database Name
const uri = 'postgresql://postgres:sino123@localhost:5432/postgres';
const dbName = 'postgresql';
//const uri = 'mongodb+srv://<postgresql://postgres:sino123@localhost:5432/postgres>@cluster0.mongodb.net/test?retryWrites=true&w=majority';


// MongoDB client and database instance
let db;

// Connect to MongoDB
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
  })
  .catch(error => console.error(error));

// Sample in-memory data storage (replace with database in production)
let dataStore = [];

// Define a route handler for the default home page
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

 // Define a POST endpoint for login
 app.post('/api/login', passport.authenticate('local'), (req, res) => {
    res.send('User authenticated');
  });

  // Define a POST endpoint for logout
  app.post('/api/logout', (req, res) => {
    req.logout(err => {
      if (err) {
        return next(err);
      }
      res.send('User logged out');
    });
  });


// Define a GET endpoint to retrieve data
app.get('/data', (req, res) => {
    res.json(dataStore);
});

// Define a POST endpoint to create new data (protected)
app.post('/api/data', (req, res) => {
    if (req.isAuthenticated()) {
      const data = req.body;
      db.collection('sigfoxData').insertOne(data)
        .then(result => {
          res.status(201).send('Data received and stored.');
        })
        .catch(error => {
          console.error(error);
          res.status(500).send('Error storing data');
        });
    } else {
      res.status(401).send('Not authenticated');
    }
  });

  // Define a PUT endpoint to update data by id (protected)
  app.put('/api/data/:id', (req, res) => {
    if (req.isAuthenticated()) {
      const id = req.params.id;
      const updatedData = req.body;

      db.collection('sigfoxData').updateOne({ _id: new ObjectId(id) }, { $set: updatedData })
        .then(result => {
          if (result.matchedCount === 0) {
            res.status(404).send('Data not found.');
          } else {
            res.send('Data updated successfully.');
          }
        })
        .catch(error => {
          console.error(error);
          res.status(500).send('Error updating data');
        });
    } else {
      res.status(401).send('Not authenticated');
    }
  });

 // Define a DELETE endpoint to delete data by id
 app.delete('/api/data/:id', (req, res) => {
    const id = req.params.id;

    db.collection('sigfoxData').deleteOne({ _id: new ObjectId(id) })
      .then(result => {
        if (result.deletedCount === 0) {
          res.status(404).send('Data not found.');
        } else {
          res.send('Data deleted successfully.');
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Error deleting data');
      });
  });


// Define the port to run the server on
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
