import React, { useState } from 'react';
import Head from 'next/head';

const premierLeagueTeams = [
  'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
  'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Liverpool',
  'Luton', 'Man City', 'Man United', 'Newcastle', 'Nottm Forest',
  'Sheff Utd', 'Tottenham', 'West Ham', 'Wolves'
];

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [club, setClub] = useState('Arsenal');
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);

  async function handlePlan(e) {
    e.preventDefault();
    if (!origin.trim()) return;

    setLoading(true);
    setCards([]);

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, club })
      });

      const data = await res.json();
      setCards(data.cards || [{ title: 'Error', subtitle: data.error || 'Unknown issue' }]);
    } catch (err) {
      console.error(err);
      setCards([{ title: 'Error', subtitle: err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Superfan Matchday Planner</title>
      </Head>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 64, lineHeight: 0.9, color: 'var(--superfan-red)' }}>
          Superfan<br />Matchday Planner
        </h1>

        <p style={{ fontSize: 20, marginTop: 40, marginBottom: 24 }}>
          Plan the perfect trip in seconds — powered by AI
        </p>

        <form onSubmit={handlePlan} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            placeholder="Your city"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            style={{ flex: '2 1 200px' }}
          />
          <select
            value={club}
            onChange={(e) => setClub(e.target.value)}
            style={{ flex: '1 1 160px' }}
          >
            {premierLeagueTeams.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <button
            type="submit"
            className={`cta ${loading ? 'animate-pulse scale-95' : ''}`}
          >
            {loading ? 'Planning...' : 'Plan My Trip'}
          </button>
        </form>

        <section style={{ marginTop: 40, display: 'grid', gap: 20 }}>
          {cards.map((card, idx) => (
            <div key={idx} className="results-card animate-slide-up">
              <strong style={{ fontSize: 18 }}>
                {card.emoji ? `${card.emoji} ` : ''}
                {card.title}
              </strong>
              {card.subtitle && <div style={{ marginTop: 6 }}>{card.subtitle}</div>}
              {card.link && (
                <div style={{ marginTop: 12 }}>
                  <a
                    href={card.link}
                    target="_blank"
                    rel="noreferrer"
                    className="cta"
                    style={{ padding: '8px 12px', fontSize: 14 }}
                  >
                    Open Link
                  </a>
                </div>
              )}
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
