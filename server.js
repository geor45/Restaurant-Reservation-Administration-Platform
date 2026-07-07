import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is working');
});

app.get('/api/google-reviews', async (req, res) => {
  try {
    const PLACE_ID = process.env.GOOGLE_PLACE_ID;
    const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

    if (!PLACE_ID || !API_KEY) {
      return res.status(500).json({
        error: 'Missing GOOGLE_PLACE_ID or GOOGLE_PLACES_API_KEY'
      });
    }

    const url = `https://places.googleapis.com/v1/places/${PLACE_ID}`;
    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews,displayName,googleMapsUri'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: 'Google Places API error',
        details: text
      });
    }

    const data = await response.json();

    const reviews = (data.reviews || []).map(r => ({
      author_name: r.authorAttribution?.displayName || 'Google Review',
      rating: r.rating || 0,
      text: r.text?.text || '',
      relativeTimeDescription: r.relativePublishTimeDescription || '',
      profilePhoto: r.authorAttribution?.photoUri || ''
    }));

    res.json({
      rating: data.rating || 0,
      userRatingsTotal: data.userRatingCount || 0,
      reviews,
      googleMapsUri: data.googleMapsUri || '',
      name: data.displayName?.text || ''
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.use(express.static('.'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});