import React, { useState, useEffect } from 'react';
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
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const kickoff = new Date('2025-05-24T15:00:00+01:00').getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = kickoff - now;
      if (diff <= 0) {
        setCountdown('Kickoff!');
        clearInterval(interval);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
                {(card.title.includes('Train') && '🚆 ') ||
                 (card.title.includes('Tube') && '🚇 ') ||
                 ''}{card.title}
              </strong>

              {card.subtitle && (
                <div style={{ marginTop: 6, fontSize: 15, lineHeight: 1.4 }}>
                  {card.subtitle}
                </div>
              )}

              {card.image && (
                <img
                  src={card.image}
                  alt="pub preview"
                  style={{
                    width: '180px',
                    height: 'auto',
                    borderRadius: 6,
                    objectFit: 'cover',
                    display: 'block',
                    marginTop: 8
                  }}
                />
              )}

              {card.embed && (
                <div style={{ marginTop: 12 }}>
                  <iframe
                    src={card.embed}
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: 10 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              )}

              {card.link && (
                <div style={{ marginTop: 12 }}>
                  <a
                    href="https://wa.me/?text=Let’s meet at the pub before kickoff!"
                    target="_blank"
                    rel="noreferrer"
                    className="cta"
                    style={{
                      padding: '10px 16px',
                      fontSize: 15,
                      fontWeight: 'bold',
                      backgroundColor: '#ff1e42',
                      color: '#fff',
                      borderRadius: 6,
                      display: 'inline-block',
                      textDecoration: 'none'
                    }}
                  >
                    Start a Group Meetup →
                  </a>
                </div>
              )}

              {card.title === 'Kickoff' && (
                <div style={{ marginTop: 12, fontSize: 15 }}>
                  ⏳ Kickoff in: {countdown}
                </div>
              )}
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
