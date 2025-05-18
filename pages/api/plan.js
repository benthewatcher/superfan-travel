import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function safeJSON(text){
  const cleaned = text.replace(/```json\s*([\s\S]*?)```/i,'$1')
                      .replace(/```([\s\S]*?)```/i,'$1')
                      .trim();
  try{return JSON.parse(cleaned);}catch{return null;}
}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).end();
  const {origin,club}=req.body||{};
  if(!origin||!club)return res.status(400).json({error:'Missing origin / club'});
  try{
    const completion = await openai.chat.completions.create({
      model:'gpt-4o-mini',
      temperature:0.6,
      messages:[
        {role:'system',content:'You are a football travel concierge. Reply ONLY in raw JSON: { "cards": [...] }'},
        {role:'user',content:`Plan a cheap, fan-friendly match-day trip from ${origin} to watch ${club}. Break it into cards (train, pub, walk, kickoff).`}
      ]
    });
    const raw = completion.choices[0].message.content;
    console.log('RAW GPT RESPONSE:', raw);
    const json=safeJSON(raw);
    if(json&&Array.isArray(json.cards)){return res.status(200).json(json);}
    return res.status(200).json({cards:[{title:'Trip Plan',subtitle:raw}]});
  }catch(err){
    console.error(err);
    return res.status(500).json({error:'OpenAI call failed',detail:err.message});
  }
}
