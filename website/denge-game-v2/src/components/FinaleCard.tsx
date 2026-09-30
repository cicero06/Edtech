import { useState } from 'react';

import { loadSession } from '../Game/data/session';
import { STAT_META } from '../Game/data/stats';
import { SOLUTION_CARDS } from '../Game/data/story';

type FinaleCardProps = {
  onSubmit: (statement: string) => void;
};

const solutionTitle = (id: string) =>
  SOLUTION_CARDS.find((c) => c.id === id)?.title ?? id;

/**
 * Chapter-2 closer: the expectation recall, the one-or-two run comparison and
 * the player's closing statement. Reads the session store directly - by this
 * point everything it needs was already persisted.
 */
export default function FinaleCard({ onSubmit }: FinaleCardProps) {
  const session = loadSession();
  const [statement, setStatement] = useState('');

  const planTitles = (session?.plan?.solutionIds ?? []).map(solutionTitle);
  const altTitles = (session?.altPlan?.solutionIds ?? []).map(solutionTitle);

  return (
    <div className="investigation-overlay" role="dialog" aria-label="Kapanış sunumu">
      <div className="investigation-card finale-card">
        <header className="investigation-header">
          <h2>🏁 KAPANIŞ SUNUMU</h2>
          <p>Bir aylık yolculuğun özeti - kararın, sonucu ve senden kalan son söz.</p>
        </header>

        {session?.expectation && (
          <p className="finale-expectation">
            🔮 Bir ay önce şunu beklemiştin: <em>&quot;{session.expectation}&quot;</em>
          </p>
        )}

        <div className={`finale-runs${altTitles.length ? ' two' : ''}`}>
          <section className="finale-run">
            <h3>{altTitles.length ? 'İlk Planın' : 'Planın'}</h3>
            <ul>
              {planTitles.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
          </section>
          {altTitles.length > 0 && (
            <section className="finale-run alt">
              <h3>Alternatif Planın</h3>
              <ul>
                {altTitles.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <table className="finale-stats" aria-label="Sonuç karşılaştırması">
          <thead>
            <tr>
              <th>Denge</th>
              <th>{altTitles.length ? 'İlk plan' : 'Sonuç'}</th>
              {altTitles.length > 0 && <th>Alternatif</th>}
            </tr>
          </thead>
          <tbody>
            {STAT_META.map(({ key, icon, label }) => {
              const first = session?.planStats?.[key];
              const alt = session?.altStats?.[key];
              return (
                <tr key={key}>
                  <td>
                    {icon} {label}
                  </td>
                  <td>{first !== undefined ? `%${first}` : '—'}</td>
                  {altTitles.length > 0 && (
                    <td>
                      {alt !== undefined ? `%${alt}` : '—'}
                      {first !== undefined && alt !== undefined && alt !== first && (
                        <em className={`finale-delta ${alt > first ? 'up' : 'down'}`}>
                          {alt > first ? '▲' : '▼'} {Math.abs(alt - first)}
                        </em>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="rationale-step finale-statement">
          <p className="rationale-question">
            ✍️ Son söz: <strong>Bugün yeniden karar verecek olsam…</strong>
          </p>
          <input
            className="rationale-input"
            type="text"
            maxLength={160}
            placeholder="…bu planı seçerdim / değiştirirdim, çünkü…"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            autoFocus
          />
        </div>

        <footer className="investigation-footer">
          <button
            className="startup-button investigation-cta"
            disabled={!statement.trim()}
            onClick={() => onSubmit(statement.trim())}
          >
            SUNUMU TAMAMLA →
          </button>
        </footer>
      </div>
    </div>
  );
}
