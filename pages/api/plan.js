import OpenAI from 'openai';
import fetch from 'node-fetch';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getPubDetails(pubName, apiKey) {
  try {
    const search = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(pubName)}&key=${apiKey}`);
    const searchData = await search.json();
    const place = searchData.results[0];
    if (!place) return null;

    const placeId = place.place_id;
    const details = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,photos,url&key=${apiKey}`);
    const detailsData = await details.json();
    const info = detailsData.result;

    const photoRef = info.photos?.[0]?.photo_reference;
    const photoUrl = photoRef
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`
      : null;

    return {
      name: info.name,
      address: info.formatted_address,
      link: info.url,
      image: photoUrl
    };
  } catch (e) {
    console.error("Pub lookup failed:", e);
    return null;
  }
}

function safeJSON(text) {
  const cleaned = text
    .replace(/```json\s*([\s\S]*?)```/i, '$1')
    .replace(/```([\s\S]*?)```/i, '$1')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { origin, club } = req.body || {};
  if (!origin || !club) return res.status(400).json({ error: 'Missing origin / club' });

  try {
    const mapsKey = process.env.MAPS_API_KEY;

    const pubData = await getPubDetails("The Twelve Pins Finsbury Park London", mapsKey);
    const cards = [];

    cards.push({
      title: "Train to London",
      subtitle: "LNER from York to King's Cross. Stops: York → Peterborough → Stevenage → King's Cross.",
      link: "https://www.thetrainline.com/"
    });

    cards.push({
      title: "Pre-Match Pub",
      subtitle: pubData ? `${pubData.name} — ${pubData.address}` : "The Twelve Pins — Arsenal pub near Emirates.",
      image: pubData?.image || "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/The_Twelve_Pins_pub_-_geograph.org.uk_-_1635929.jpg/640px-The_Twelve_Pins_pub_-_geograph.org.uk_-_1635929.jpg",
      link: pubData?.link || "https://www.google.com/maps/place/The+Twelve+Pins+N4+2DE"
    });

    cards.push({
      title: "Walk to the Stadium",
      subtitle: "Leave pub by 2:45 PM to reach Emirates by 3 PM.",
      embed: `https://www.google.com/maps/embed/v1/directions?key=${mapsKey}&origin=The+Twelve+Pins+N4+2DE&destination=Emirates+Stadium+N5+1BU&mode=walking`
    });

    cards.push({
      title: "Kickoff",
      subtitle: "Enjoy the match — you made it!"
    });

    return res.status(200).json({ cards });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'OpenAI or Google Maps call failed', detail: err.message });
  }
}
