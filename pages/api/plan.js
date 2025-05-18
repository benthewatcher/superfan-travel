import OpenAI from 'openai';
import fetch from 'node-fetch';
import { clubs } from '../../utils/clubs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const info = clubs[club] || {
      stadium: "Emirates Stadium",
      postcode: "N5 1BU",
      arrivalStation: "London King's Cross"
    };

    const cards = [];

    cards.push({
      title: "Train to London King's Cross",
      subtitle: `From ${origin} to ${info.arrivalStation}. Common stops: York → Stevenage → King's Cross.`,
      link: "https://www.thetrainline.com"
    });

    cards.push({
      title: "Tube to Stadium",
      subtitle: "Piccadilly Line from King's Cross to Arsenal (approx. 11 mins). Stops: King's Cross → Russell Square → Caledonian Road → Arsenal."
    });

    cards.push({
      title: "Pre-Match Pub",
      subtitle: "The Twelve Pins — 263 Seven Sisters Rd, Arsenal pub. 0.4 miles from stadium.",
      image: "https://live.staticflickr.com/2120/2505261057_f4280f62b4_o.jpg",
      link: "https://wa.me/?text=Let’s meet at The Twelve Pins before the match!"
    });

    cards.push({
      title: "Walk to the Stadium",
      subtitle: "Leave pub by 2:45 PM to reach Emirates by 3:00 PM.",
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
