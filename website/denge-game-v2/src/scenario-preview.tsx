/**
 * Senaryo önizleme — dev-only review page for the text bank (not built).
 * Shows 12 students' towns side by side, each with three typical plans, so
 * the team can read every number and sentence before release.
 */
import { createRoot } from 'react-dom/client';
import { SOLUTION_CARDS } from './Game/data/story';
import { reviewOutcome, scenarioCard, scenarioSummary, scenarioTwist } from './Game/scenario';
import { facts, simulate } from './Game/scenario/model';
import { createScenario, DEFAULT_PARAMS, type ScenarioState } from './Game/scenario/variants';
import './scenario-preview.css';

const PLANS: { name: string; ids: string[] }[] = [
  { name: 'A · Kaçak + damla sulama', ids: ['repair-pipes', 'drip-irrigation', 'saving-campaign', 'fountains-off'] },
  { name: 'B · Yağmur depoları', ids: ['rain-harvest', 'saving-campaign', 'fountains-off'] },
  { name: 'C · Yalnız ucuz önlemler', ids: ['fountains-off', 'saving-campaign'] },
];
const NPCS = [
  ['muhendis-aylin', '💧 Aylin'],
  ['ciftci-riza', '🌾 Rıza'],
  ['nuri-amca', '🏠 Nuri'],
  ['isci-kemal', '🌳 Kemal'],
] as const;
const cost = (ids: string[]) => ids.reduce((sum, id) => sum + (SOLUTION_CARDS.find((c) => c.id === id)?.cost ?? 0), 0);

const STUDENTS: { label: string; state: ScenarioState }[] = [
  { label: 'Standart (eski kayıtlar)', state: { seed: 'standart', params: DEFAULT_PARAMS } },
  ...Array.from({ length: 11 }, (_, i) => ({ label: `Öğrenci ${i + 1}`, state: createScenario(`onizleme-${i + 1}`) })),
];

export function Student({ label, state }: { label: string; state: ScenarioState }) {
  const f = facts(state.params);
  const baraj = scenarioCard('baraj', state)!;
  return (
    <article className="pv-student">
      <header>
        <h2>{label}</h2>
        <p>{scenarioSummary(state)}</p>
        <p className="pv-ledger">
          Su defteri: baraj {f.outflowL} = evler {f.homesL} + park {f.parkL} + kaçak {f.leakL} L/dk · tarla kanalı{' '}
          {f.farmL} L/dk · rezerv geçmişi {f.history.lastYear} → {f.history.winter} → {f.history.spring} →{' '}
          {f.history.today} · kritik eşik %{f.criticalPct}
        </p>
      </header>
      <section className="pv-ch1">
        <h3>1. bölüm · deftere düşenler</h3>
        <ul>
          <li><b>Baraj:</b> {baraj.hint} <em>({baraj.datum})</em></li>
          <li><b>Grafik açıklaması:</b> {baraj.checkQuestion?.explanation}</li>
          <li><b>Konut:</b> {scenarioCard('konut', state)?.datum}</li>
          <li><b>Park:</b> {scenarioCard('park', state)?.datum}</li>
        </ul>
      </section>
      <div className="pv-plans">
        {PLANS.map((plan) => {
          const o = simulate(state.params, plan.ids);
          const twist = scenarioTwist(plan.ids, state);
          return (
            <section key={plan.name} className="pv-plan">
              <h3>{plan.name}</h3>
              <p className="pv-meta">
                ₺{cost(plan.ids).toLocaleString('tr-TR')} · rezerv %{o.reservoirBefore} → <b>%{o.reservoirAfter}</b>{' '}
                (plansız %{o.reservoirNoPlan}) · {o.deltaPts > 0 ? '+' : ''}
                {o.deltaPts} puan
              </p>
              {twist && <p className="pv-twist">Ay ortası · {twist}</p>}
              {NPCS.map(([id, name]) => {
                const r = reviewOutcome(id, plan.ids, state);
                return (
                  <div key={id} className="pv-line">
                    <b>{name}</b>
                    {r ? (
                      <>
                        <p>{r.text}</p>
                        <small>
                          📒 {r.finding.text} {r.finding.datum && <em>({r.finding.datum})</em>}
                        </small>
                      </>
                    ) : (
                      <p className="pv-silent">— söylenecek tutarlı bir şey yok, susuyor —</p>
                    )}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </article>
  );
}

export function Preview() {
  return (
    <main className="pv">
      <header className="pv-head">
        <h1>Senaryo Önizleme</h1>
        <p>
          Her öğrenci aynı hikâyeyi, aynı sebep-sonuç modeliyle ama kendine özgü sayılarla oynar. Aşağıda 12 kasaba ve
          her birinde 3 tipik plan var. Bir cümle ya da sayı yanlış görünüyorsa yerini not et.
        </p>
      </header>
      {STUDENTS.map((s) => (
        <Student key={s.label} {...s} />
      ))}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
