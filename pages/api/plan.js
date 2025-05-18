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
          content: 'You are a football travel concierge. Reply ONLY in raw JSON like this:
{
  "cards": [
    { "title": "Train to London", "subtitle": "Take LNER from York to King's Cross. Avg £40, 2h 10m." },
    { "title": "Pre-Match Pub", "subtitle": "The Twelve Pins – Arsenal pub, 10 min walk to Emirates." },
    { "title": "Walk to the Stadium", "subtitle": "Leave by 2:45 PM to arrive by 3 PM." },
    { "title": "Kickoff", "subtitle": "Enjoy the match and the atmosphere!" }
  ]
}'
        },
        {
          role: 'user',
          content: `Plan a cheap, fan-friendly match-day trip from ${origin} to watch ${club}. Follow the exact format above and include subtitle details.`
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
        { title: "Train to London", subtitle: "Take LNER from York to King's Cross. Avg: £40, 2h 15m." },
        { title: "Pre-Match Pub", subtitle: "The Twelve Pins – Arsenal-friendly pub, 10 min from stadium." },
        { title: "Walk to the Stadium", subtitle: "Leave pub by 2:45 PM to reach Emirates by 3:00 PM." },
        { title: "Kickoff", subtitle: "Enjoy the match — you made it!" }
      ]
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'OpenAI call failed', detail: err.message });
  }
}
