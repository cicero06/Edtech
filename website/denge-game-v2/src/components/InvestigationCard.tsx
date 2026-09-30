import { useState } from 'react';

import { SPRITESHEET_ASSETS } from '../Game/data/assets';
import type { InvestigationCard as CardData } from '../Game/data/story';
import ChartView from './ChartView';

type InvestigationCardProps = {
  card: CardData;
  onComplete: (cardId: string) => void;
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${encodeURI(path)}`;

function NpcPortrait({ textureKey, name }: { textureKey: string; name: string }) {
  const sheet = SPRITESHEET_ASSETS.find((s) => s.key === textureKey);
  if (!sheet) return null;
  // Show only the first (front-facing) frame of the strip.
  const height = 64;
  const frameW = (sheet.frameWidth / sheet.frameHeight) * height;
  const stripW = frameW * sheet.columns;
  return (
    <div className="card-portrait" style={{ width: frameW, height }} role="img" aria-label={name}>
      <img src={assetUrl(sheet.path)} alt="" style={{ width: stripW, height }} draggable={false} />
    </div>
  );
}

export default function InvestigationCard({ card, onComplete }: InvestigationCardProps) {
  const [hypothesisPicked, setHypothesisPicked] = useState<number | null>(null);
  const [answerPicked, setAnswerPicked] = useState<number | null>(null);

  const hypothesisDone = !card.hypothesis || hypothesisPicked !== null;
  const checkDone = !card.checkQuestion || answerPicked !== null;
  const canComplete = hypothesisDone && checkDone;

  return (
    <div className="investigation-overlay" role="dialog" aria-label={`${card.title} - ${card.subtitle}`}>
      <div className="investigation-card">
        <header className="investigation-header">
          <h2>
            {card.icon} {card.title}
          </h2>
          <p>{card.subtitle}</p>
        </header>

        <div className="investigation-speaker">
          <NpcPortrait textureKey={card.portrait} name={card.npcName} />
          <div>
            <strong>{card.npcName}</strong>
            <span>{card.npcRole}</span>
          </div>
        </div>

        <div className="investigation-body">
          {card.paragraphs.map((text, i) => (
            <p key={i}>{text}</p>
          ))}

          {card.listItems && (
            <ul className="investigation-list">
              {card.listItems.map((item) => (
                <li key={item.text}>
                  {item.icon} {item.text}
                </li>
              ))}
            </ul>
          )}
        </div>

        {card.fact && (
          <div className="investigation-fact">
            <strong>{card.factTitle ?? 'Biliyor muydun?'}</strong>
            <p>{card.fact}</p>
          </div>
        )}

        {card.hypothesis && (
          <div className="card-question">
            <strong>🤔 {card.hypothesis.question}</strong>
            <div className="card-question-options">
              {card.hypothesis.options.map((option, i) => (
                <button
                  key={option}
                  className={`question-option${hypothesisPicked === i ? ' picked' : ''}`}
                  onClick={() => setHypothesisPicked(i)}
                  disabled={hypothesisPicked !== null}
                >
                  {option}
                </button>
              ))}
            </div>
            {hypothesisPicked !== null && (
              <p className="question-response">{card.hypothesis.response}</p>
            )}
          </div>
        )}

        {card.chart && <ChartView chart={card.chart} />}

        {card.checkQuestion && (
          <div className="card-question">
            <strong>🧠 {card.checkQuestion.question}</strong>
            <div className="card-question-options">
              {card.checkQuestion.options.map((option, i) => {
                const state =
                  answerPicked === null
                    ? ''
                    : i === card.checkQuestion!.correctIndex
                      ? ' correct'
                      : i === answerPicked
                        ? ' wrong'
                        : '';
                return (
                  <button
                    key={option}
                    className={`question-option${state}`}
                    onClick={() => setAnswerPicked(i)}
                    disabled={answerPicked !== null}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {answerPicked !== null && (
              <p className="question-response">{card.checkQuestion.explanation}</p>
            )}
          </div>
        )}

        <footer className="investigation-footer">
          <div className="investigation-hint">
            <strong>Kazanılan ipucu</strong>
            <p>
              {card.icon} {card.hint}
            </p>
          </div>
          <button
            className="startup-button investigation-cta"
            onClick={() => onComplete(card.id)}
            disabled={!canComplete}
            autoFocus
          >
            {card.cta}
          </button>
        </footer>
      </div>
    </div>
  );
}
