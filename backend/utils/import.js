// Envoyer votre ficher local JSON vers votre BDD mongoDB
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');

async function importCollection() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('boutique'); // chemin dans votre BDD MongoDB
  const col = db.collection('products'); // chemin dans votre BDD MongoDB

  await col.deleteMany({});

  const docs = JSON.parse(fs.readFileSync('produits.json', 'utf-8'));

  const docsWithObjectIdAndDate = docs.map((doc) => {
    let _id;
    if (doc._id) {
      try {
        _id = new ObjectId(doc._id.$oid || doc._id);
      } catch (err) {
        _id = new ObjectId();
      }
    } else {
      _id = new ObjectId();
    }

    let date;
    if (doc.date && doc.date.$date) {
      date = new Date(doc.date.$date);
    } else if (doc.date) {
      date = new Date(doc.date);
    } else {
      date = new Date();
    }

    return { ...doc, _id, date };
  });

  await col.insertMany(docsWithObjectIdAndDate);

  console.log('Import terminé depuis produits.json avec dates correctes');
  await client.close();
}

importCollection().catch(console.error);
