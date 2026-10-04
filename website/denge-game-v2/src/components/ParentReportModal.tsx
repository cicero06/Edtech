import { useEffect } from 'react';
import type { PublicReportResult } from '../Game/sync/api';
import { STAT_META, type GameStats } from '../Game/data/stats';
import { SOLUTION_CARDS } from '../Game/data/story';

type ParentReportModalProps = {
  report: PublicReportResult;
  onClose: () => void;
};

const STAT_COLORS: Record<keyof GameStats, string> = {
  environment: '#57b36a',
  economy: '#e0b34f',
  society: '#5f9fd8',
  water: '#4db8e0',
};

function statusLabel(val: number): { text: string; cls: string } {
  if (val < 30) return { text: 'Kritik', cls: 'status-critical' };
  if (val < 60) return { text: 'Dikkat', cls: 'status-warning' };
  return { text: 'Dengeli', cls: 'status-good' };
}

const solutionTitle = (id: string) =>
  SOLUTION_CARDS.find((c) => c.id === id)?.title ?? id;

export default function ParentReportModal({ report, onClose }: ParentReportModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const stats = report.state?.stats;
  const notebook = report.state?.notebook ?? [];
  const plan = report.state?.plan;
  const finalStatement = report.state?.finalStatement;

  return (
    <div className="report-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="report-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="report-modal-header">
          <div className="report-badge-row">
            <span className="report-eyebrow">DENGE KASABASI · GELİŞİM RAPORU</span>
            <span className={`report-status-pill status-${report.status.toLowerCase()}`}>
              {report.status === 'COMPLETED'
                ? '✓ Tamamlandı'
                : report.status === 'ACTIVE'
                  ? '↻ Devam Ediyor'
                  : '○ Henüz Başlamadı'}
            </span>
          </div>
          <h2 className="report-student-name">{report.studentName}</h2>
          <p className="report-school-meta">
            <strong>{report.schoolName}</strong> · {report.groupName}
            <span className="report-share-chip">
              Veli Kodu: <code>{report.shareCode}</code>
            </span>
          </p>
        </header>

        <div className="report-modal-body">
          {/* Denge Göstergeleri */}
          <section className="report-section">
            <h3 className="report-section-title">⚖ Kasaba Denge Göstergeleri</h3>
            {stats ? (
              <div className="report-stats-grid">
                {STAT_META.map(({ key, icon, label }) => {
                  const val = stats[key] ?? 50;
                  const stat = statusLabel(val);
                  return (
                    <div key={key} className="report-stat-item">
                      <div className="report-stat-header">
                        <span className="report-stat-icon">{icon}</span>
                        <span className="report-stat-name">{label}</span>
                        <span className={`report-stat-tag ${stat.cls}`}>{stat.text}</span>
                      </div>
                      <div className="report-progress-track">
                        <div
                          className="report-progress-fill"
                          style={{
                            width: `${Math.min(100, Math.max(0, val))}%`,
                            backgroundColor: STAT_COLORS[key],
                          }}
                        />
                      </div>
                      <span className="report-stat-num">%{val}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="report-empty-note">
                Öğrenci henüz oyuna başlamadı veya denge değerleri kaydedilmedi.
              </p>
            )}
          </section>

          {/* İnceleme & Kanıtlar */}
          <section className="report-section">
            <h3 className="report-section-title">
              🔍 Araştırma & Kanıtlar ({notebook.length} Bulgulandı)
            </h3>
            {notebook.length > 0 ? (
              <ul className="report-notebook-list">
                {notebook.map((item, idx) => (
                  <li key={idx} className="report-notebook-item">
                    <span className="report-notebook-icon">{item.icon}</span>
                    <span className="report-notebook-text">{item.text}</span>
                    {item.datum && <em className="report-notebook-datum">{item.datum}</em>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="report-empty-note">Henüz deftere işlenmiş bulgu yok.</p>
            )}
          </section>

          {/* Eylem Planı */}
          {plan && (
            <section className="report-section">
              <h3 className="report-section-title">📋 Uygulanan Eylem Planı</h3>
              <div className="report-plan-box">
                <ul className="report-plan-solutions">
                  {plan.solutionIds.map((sid) => (
                    <li key={sid}>✓ {solutionTitle(sid)}</li>
                  ))}
                </ul>
                <p className="report-plan-cost">
                  Toplam Yatırım Maliyeti: <strong>{plan.totalCost.toLocaleString('tr-TR')} ₺</strong>
                </p>
                {plan.rationale && (
                  <p className="report-plan-rationale">
                    Gerekçe: <em>&quot;{plan.rationale}&quot;</em>
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Kapanış Görüşü */}
          {finalStatement && (
            <section className="report-section">
              <h3 className="report-section-title">💬 Öğrencinin Son Değerlendirmesi</h3>
              <blockquote className="report-quote">
                &quot;{finalStatement}&quot;
              </blockquote>
            </section>
          )}

          {/* Pedagojik Açıklama */}
          <div className="report-pedagogical-note">
            <h4>💡 Veliye Not</h4>
            <p>
              Denge Kasabası, çocukların karmaşık sosyal ve çevresel problemlerde karar alma,
              veri toplama ve kaynak yönetimi becerilerini ölçen ve destekleyen etkileşimli bir simülasyondur.
              Buradaki değerler bir sınav notu değil, öğrencinin kasaba dengesini koruma sürecindeki stratejik yaklaşımlarıdır.
            </p>
          </div>
        </div>

        <footer className="report-modal-footer">
          <button
            type="button"
            className="startup-button startup-button-glass"
            onClick={() => window.print()}
          >
            🖨 Yazdır / PDF
          </button>
          <button
            type="button"
            className="startup-button startup-button-primary"
            onClick={onClose}
          >
            Kapat
          </button>
        </footer>
      </div>
    </div>
  );
}
