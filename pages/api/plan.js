import OpenAI from 'openai';

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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      messages: [
        {
          role: 'system',
          content: 'You are a football travel concierge. Reply ONLY in raw JSON: { "cards": [...] } with subtitle, link, image, or embed fields where relevant.'
        },
        {
          role: 'user',
          content: `Plan a matchday trip from ${origin} to watch ${club}. Return 4 cards with subtitle, and where relevant: \n- a Trainline link, \n- a pub photo + Google Maps link, \n- a Google Maps walking embed from pub to stadium, \n- a kickoff message.`
        }
      ]
    });

    const raw = completion.choices[0].message.content;
    console.log('RAW GPT RESPONSE:', raw);

    const json = safeJSON(raw);
    if (json && Array.isArray(json.cards) && json.cards[0]?.title) {
      return res.status(200).json(json);
    }

    return res.status(200).json({
      cards: [
        {
          title: "Train to London",
          subtitle: "Take LNER from York to King's Cross. Avg: £40, 2h 15m.",
          link: "https://www.thetrainline.com/"
        },
        {
          title: "Pre-Match Pub",
          subtitle: "The Twelve Pins — 263 Seven Sisters Rd, Arsenal pub. 0.4 miles from stadium.",
          image: "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=CmRaAAAAr9...fakesample&key=AIzaSyC0tPqc35B0xDtklGyTY5D9Ei95OZv7AuY",
          link: "https://www.google.com/maps/place/The+Twelve+Pins+N4+2DE"
        },
        {
          title: "Walk to the Stadium",
          subtitle: "Leave by 2:45 PM to reach Emirates by 3 PM.",
          embed: "https://www.google.com/maps/embed/v1/directions?key=AIzaSyC0tPqc35B0xDtklGyTY5D9Ei95OZv7AuY&origin=The+Twelve+Pins+N4+2DE&destination=Emirates+Stadium+N5+1BU&mode=walking"
        },
        {
          title: "Kickoff",
          subtitle: "Enjoy the match — you made it!"
        }
      ]
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'OpenAI call failed', detail: err.message });
  }
}