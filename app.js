const express = require('express');
const mongoose = require('mongoose');
const app = express();

mongoose.connect('YOUR_MONGODB_URI', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

const shortURLSchema = new mongoose.Schema({
  destinationURL: {
    type: String,
    required: true,
    unique: true,
  },
  shortURL: {
    type: String,
    required: true,
    unique: true,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
});

const ShortURL = mongoose.model('ShortURL', shortURLSchema);

function generateShortURL() {
  return 'www.ppa.in/' + 'unique_short_code';
}

async function shortenURL(destinationURL, expirationDate) {
  const shortURL = generateShortURL();
  await ShortURL.create({
    destinationURL,
    shortURL,
    expirationDate,
  });
  return shortURL;
}

async function updateShortURL(shortURL, newDestinationURL) {
  const existingURL = await ShortURL.findOne({ shortURL });
  if (!existingURL) {
    return false;
  }
  existingURL.destinationURL = newDestinationURL;
  await existingURL.save();
  return true;
}

async function getDestinationURL(shortURL) {
  const urlDocument = await ShortURL.findOne({ shortURL });
  if (!urlDocument) {
    return null;
  }
  return urlDocument.destinationURL;
}

async function updateExpiry(shortURL, daysToAdd) {
  const existingURL = await ShortURL.findOne({ shortURL });
  if (!existingURL) {
    return false;
  }
  existingURL.expirationDate.setDate(existingURL.expirationDate.getDate() + daysToAdd);
  await existingURL.save();
  return true;
}

app.use(express.json());

app.post('/shorten', async (req, res) => {
  const { destinationURL, expirationDate } = req.body;
  const shortURL = await shortenURL(destinationURL, expirationDate);
  res.json({ shortURL });
});

app.put('/update/:shortURL', async (req, res) => {
  const shortURL = req.params.shortURL;
  const { newDestinationURL } = req.body;
  const updated = await updateShortURL(shortURL, newDestinationURL);
  res.json({ updated });
});

app.get('/:shortURL', async (req, res) => {
  const shortURL = req.params.shortURL;
  const destinationURL = await getDestinationURL(shortURL);
  if (destinationURL) {
    res.redirect(destinationURL);
  } else {
    res.status(404).send('URL not found');
  }
});

app.put('/expire/:shortURL', async (req, res) => {
  const shortURL = req.params.shortURL;
  const { daysToAdd } = req.body;
  const updated = await updateExpiry(shortURL, daysToAdd);
  res.json({ updated });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
