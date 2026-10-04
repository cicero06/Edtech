import { useEffect, useState } from 'react';

import StaffPanel from './StaffPanel';
import ParentReportModal from './ParentReportModal';
import { SoundKeys, TextureKeys } from '../Game/data/assets';
import { playSfx } from '../Game/audio';
import {
  hydrateRemoteSession,
  type StudentProfile,
} from '../Game/data/session';
import { bindAttempt, joinRemote } from '../Game/sync/engine';
import {
  ensureAdultSession,
  getAdultSession,
  isAdultAuthConfigured,
  signInAdult,
  signOutAdult,
  signUpAdult,
  type AdultSession,
} from '../Game/sync/adultAuth';
import {
  getPublicReport,
  type PublicReportResult,
  type StaffAuth,
} from '../Game/sync/api';

type StudentGateProps = {
  onPick: (student: StudentProfile) => void;
};

type GateRole = 'student' | 'teacher' | 'parent';
type GateView = 'login' | 'dev' | 'staff';

export default function StudentGate({ onPick }: StudentGateProps) {
  const [adult, setAdult] = useState<AdultSession | null>(() => getAdultSession());
  const [devHandle, setDevHandle] = useState('');
  const [view, setView] = useState<GateView>(adult ? 'staff' : 'login');
  const [role, setRole] = useState<GateRole>('student');

  // Student form fields
  const [studentCode, setStudentCode] = useState('');
  const [studentName, setStudentName] = useState('');

  // Teacher form fields
  const [teacherMode, setTeacherMode] = useState<'login' | 'register'>('login');
  const [teacherFullName, setTeacherFullName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Parent form fields
  const [reportCode, setReportCode] = useState('');
  const [viewingReport, setViewingReport] = useState<PublicReportResult | null>(null);

  // Common status
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // A stored refresh token can resurrect the adult session after expiry.
  useEffect(() => {
    if (adult) return;
    void ensureAdultSession().then((restored) => {
      if (restored) {
        setAdult(restored);
        setView('staff');
      }
    });
  }, [adult]);

  const staffAuth: StaffAuth | null = adult
    ? { token: adult.accessToken }
    : devHandle
      ? { subject: devHandle }
      : null;

  const identity = adult?.email ?? devHandle;

  const signOut = () => {
    signOutAdult();
    setAdult(null);
    setDevHandle('');
    setError(null);
    setView('login');
  };

  // Student login action
  const handleStudentLogin = async () => {
    const code = studentCode.trim().toUpperCase();
    const name = studentName.trim();
    if (!code || !name || busy) return;

    setBusy(true);
    setError(null);
    try {
      const result = await joinRemote(code, name);
      const computedShareCode = `DNGA-${result.participantId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;

      const student: StudentProfile = {
        id: result.participantId,
        classId: code,
        name: name,
        avatar: TextureKeys.PLAYER,
        shareCode: computedShareCode,
        createdAt: Date.now(),
      };

      if (result.resumedState) {
        hydrateRemoteSession(result.participantId, result.resumedState);
      }

      await bindAttempt({
        attemptId: result.attemptId,
        participantId: result.participantId,
        token: result.token,
        revision: result.revision,
        joinCode: code,
        displayName: name,
        fresh: !result.resumedState,
      });

      playSfx(SoundKeys.COMPLETE, 0.8);
      onPick(student);
    } catch {
      setError('Giriş yapılamadı — Sınıf kodunu, listedeki adını ve öğretmenin oyunu açıp açmadığını kontrol et.');
    } finally {
      setBusy(false);
    }
  };

  // Teacher login action
  const handleTeacherLogin = async () => {
    const email = teacherEmail.trim();
    const password = teacherPassword.trim();
    if (!email || !password || busy) return;

    if (!isAdultAuthConfigured()) {
      setError('Yönetici girişi bu ortamda yapılandırılmamış.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const session = await signInAdult(email, password);
      playSfx(SoundKeys.COMPLETE, 0.7);
      setAdult(session);
      setView('staff');
    } catch {
      setError('Giriş başarısız — E-posta ve şifrenizi kontrol edin.');
    } finally {
      setBusy(false);
    }
  };

  // Teacher register action
  const handleTeacherRegister = async () => {
    const fullName = teacherFullName.trim();
    const email = teacherEmail.trim();
    const password = teacherPassword.trim();
    if (!email || !password || busy) return;

    if (password.length < 6) {
      setError('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (!isAdultAuthConfigured()) {
      setError('Öğretmen kayıt sistemi bu ortamda yapılandırılmamış.');
      return;
    }

    setBusy(true);
    setError(null);
    setInfoMessage(null);
    try {
      const res = await signUpAdult(email, password, fullName);
      if (res.session) {
        playSfx(SoundKeys.COMPLETE, 0.7);
        setAdult(res.session);
        setView('staff');
      } else if (res.requiresEmailConfirmation) {
        setInfoMessage(
          'Hesabınız başarıyla oluşturuldu! Lütfen e-postanıza gönderilen onay bağlantısına tıklayın, ardından giriş yapın.',
        );
        setTeacherMode('login');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Kayıt başarısız oldu — e-postanızı kontrol edin.',
      );
    } finally {
      setBusy(false);
    }
  };

  // Parent report lookup action
  const handleParentLookup = async () => {
    const code = reportCode.trim().toUpperCase();
    if (!code || busy) return;

    setBusy(true);
    setError(null);
    try {
      const report = await getPublicReport(code);
      playSfx(SoundKeys.PAGE, 0.7);
      setViewingReport(report);
    } catch {
      setError('Rapor bulunamadı — Lütfen 6 haneli rapor kodunu kontrol edin (örn: DNGA-XXXXXX).');
    } finally {
      setBusy(false);
    }
  };

  // ================= STAFF console (adult) =================
  if (view === 'staff' && staffAuth) {
    return (
      <StaffPanel auth={staffAuth} identity={identity} onSignOut={signOut} />
    );
  }

  // ================= DEV handle (no Supabase configured) =================
  if (view === 'dev') {
    return (
      <div className="gate-card" aria-label="Geliştirici girişi">
        <p className="startup-eyebrow">GELİŞTİRİCİ GİRİŞİ</p>
        <h2 className="profile-title gate-title">Yönetici adı</h2>
        <p className="gate-hint">
          Supabase yapılandırılmadığı için dev handle kullanılıyor — yalnızca
          production dışı backend&apos;lerde geçer.
        </p>
        <input
          className="gate-code-input"
          type="text"
          placeholder="YÖNETİCİ ADI"
          maxLength={40}
          value={devHandle}
          autoFocus
          onChange={(e) => setDevHandle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && devHandle.trim() && setView('staff')}
        />
        <button
          className="startup-button startup-button-primary"
          disabled={!devHandle.trim()}
          onClick={() => setView('staff')}
        >
          Devam →
        </button>
        <button className="gate-link" onClick={() => setView('login')}>
          ← Geri dön
        </button>
      </div>
    );
  }

  // ================= 3-TAB UNIFIED LOGIN =================
  return (
    <>
      <div className="gate-card professional-gate" aria-label="Denge Kasabası Girişi">
        {/* Role Selector Tabs */}
        <div className="gate-role-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={role === 'student'}
            className={`gate-role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => {
              setRole('student');
              setError(null);
            }}
          >
            🎒 Öğrenci
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'teacher'}
            className={`gate-role-tab ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => {
              setRole('teacher');
              setError(null);
            }}
          >
            👨‍🏫 Öğretmen
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'parent'}
            className={`gate-role-tab ${role === 'parent' ? 'active' : ''}`}
            onClick={() => {
              setRole('parent');
              setError(null);
            }}
          >
            👨‍👩‍👧 Veli Raporu
          </button>
        </div>

        {/* Tab 1: Öğrenci Girişi */}
        {role === 'student' && (
          <div className="gate-tab-content">
            <h2 className="profile-title gate-title">Kasabaya Katıl</h2>
            <p className="gate-hint">
              Öğretmeninin verdiği <strong>sınıf kodunu</strong> ve listedeki <strong>adını</strong> yaz.
            </p>
            <input
              className="gate-code-input"
              type="text"
              placeholder="SINIF KODU (örn. K7X29M)"
              maxLength={12}
              value={studentCode}
              autoFocus
              onChange={(e) => setStudentCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleStudentLogin()}
            />
            <input
              className="gate-code-input gate-name-input"
              type="text"
              placeholder="LİSTEDEKİ ADIN SOYADIN"
              maxLength={60}
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleStudentLogin()}
            />
            {error && <p className="gate-error" role="alert">{error}</p>}
            <button
              className="startup-button startup-button-primary"
              disabled={!studentCode.trim() || !studentName.trim() || busy}
              onClick={() => void handleStudentLogin()}
            >
              {busy ? 'Bağlanıyor…' : 'Oyuna Başla →'}
            </button>
          </div>
        )}

        {/* Tab 2: Öğretmen Girişi & Kayıt */}
        {role === 'teacher' && (
          <div className="gate-tab-content">
            <h2 className="profile-title gate-title">
              {teacherMode === 'login' ? 'Öğretmen Girişi' : 'Yeni Öğretmen Kaydı'}
            </h2>
            <p className="gate-hint">
              {teacherMode === 'login'
                ? 'Sınıf kodları üretmek ve oturumları başlatmak için giriş yapın.'
                : 'Sınıflarınızı oluşturup öğrencilerinizi takip etmek için kayıt olun.'}
            </p>

            {infoMessage && (
              <p className="gate-success-toast" role="status">
                {infoMessage}
              </p>
            )}

            {teacherMode === 'register' && (
              <input
                className="gate-code-input gate-name-input"
                type="text"
                placeholder="ADINIZ SOYADINIZ"
                maxLength={60}
                value={teacherFullName}
                autoFocus
                onChange={(e) => setTeacherFullName(e.target.value)}
              />
            )}

            <input
              className="gate-code-input gate-name-input"
              type="email"
              placeholder="E-POSTA ADRESİNİZ"
              maxLength={80}
              value={teacherEmail}
              autoFocus={teacherMode === 'login'}
              onChange={(e) => setTeacherEmail(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                (teacherMode === 'login'
                  ? void handleTeacherLogin()
                  : void handleTeacherRegister())
              }
            />

            <input
              className="gate-code-input gate-name-input"
              type="password"
              placeholder="ŞİFRENİZ (en az 6 karakter)"
              maxLength={80}
              value={teacherPassword}
              onChange={(e) => setTeacherPassword(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                (teacherMode === 'login'
                  ? void handleTeacherLogin()
                  : void handleTeacherRegister())
              }
            />

            {error && <p className="gate-error" role="alert">{error}</p>}

            {teacherMode === 'login' ? (
              <>
                <button
                  className="startup-button startup-button-primary"
                  disabled={!teacherEmail.trim() || !teacherPassword.trim() || busy}
                  onClick={() => void handleTeacherLogin()}
                >
                  {busy ? 'Doğrulanıyor…' : 'Giriş Yap →'}
                </button>
                <button
                  type="button"
                  className="gate-link"
                  onClick={() => {
                    setTeacherMode('register');
                    setError(null);
                    setInfoMessage(null);
                  }}
                >
                  Hesabınız yok mu? <strong>Öğretmen Kaydı Oluşturun</strong>
                </button>
              </>
            ) : (
              <>
                <button
                  className="startup-button startup-button-primary"
                  disabled={
                    !teacherEmail.trim() ||
                    !teacherPassword.trim() ||
                    !teacherFullName.trim() ||
                    busy
                  }
                  onClick={() => void handleTeacherRegister()}
                >
                  {busy ? 'Kaydediliyor…' : 'Kayıt Ol ve Paneli Aç →'}
                </button>
                <button
                  type="button"
                  className="gate-link"
                  onClick={() => {
                    setTeacherMode('login');
                    setError(null);
                    setInfoMessage(null);
                  }}
                >
                  Zaten hesabınız var mı? <strong>Giriş Yapın</strong>
                </button>
              </>
            )}

            {!isAdultAuthConfigured() && (
              <button className="gate-link" onClick={() => setView('dev')}>
                🛠 Geliştirici Girişi
              </button>
            )}
          </div>
        )}

        {/* Tab 3: Veli Raporu */}
        {role === 'parent' && (
          <div className="gate-tab-content">
            <h2 className="profile-title gate-title">Öğrenci Gelişim Raporu</h2>
            <p className="gate-hint">
              Öğretmenden veya öğrenciden aldığınız <strong>Veli Rapor Kodunu</strong> girerek gelişim durumunu inceleyin.
            </p>
            <input
              className="gate-code-input"
              type="text"
              placeholder="RAPOR KODU (DNGA-XXXXXX)"
              maxLength={20}
              value={reportCode}
              autoFocus
              onChange={(e) => setReportCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleParentLookup()}
            />
            {error && <p className="gate-error" role="alert">{error}</p>}
            <button
              className="startup-button startup-button-primary"
              disabled={!reportCode.trim() || busy}
              onClick={() => void handleParentLookup()}
            >
              {busy ? 'Rapor aranıyor…' : 'Raporu Görüntüle →'}
            </button>
          </div>
        )}
      </div>

      {/* Modal for viewing student report */}
      {viewingReport && (
        <ParentReportModal
          report={viewingReport}
          onClose={() => setViewingReport(null)}
        />
      )}
    </>
  );
}
