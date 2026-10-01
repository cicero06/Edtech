import { useState } from 'react';

import { AvatarFace } from './IntroSequence';
import { SoundKeys, TextureKeys, type TextureKey } from '../Game/data/assets';
import { playSfx } from '../Game/audio';
import {
  AVATARS,
  AVATAR_LABELS,
  QUEST_STAGE_LABELS,
  addClass,
  addStudent,
  clearLastClass,
  getCurrentTeacher,
  joinByCode,
  lastJoinCode,
  listClasses,
  listStudents,
  loginTeacher,
  logoutTeacher,
  removeClass,
  removeStudent,
  sessionSummary,
  type ClassRoom,
  type JoinedClass,
  type StudentProfile,
} from '../Game/data/session';

/**
 * "Who is playing?" gate - the org layer's UI, mirroring the future Atlas flow:
 *
 *   Student:  type class code -> class roster -> pick your card -> play.
 *             The roster is never shown without a valid code.
 *   Teacher:  school + name sign-in (mock, no password yet) -> class list ->
 *             per-class student management + parent share codes.
 *
 * A classroom device remembers the last joined class, so kids go straight to
 * their roster on repeat visits.
 */
type StudentGateProps = {
  onPick: (student: StudentProfile) => void;
};

type GateView = 'code' | 'roster' | 'teacher-auth' | 'teacher' | 'class';

export default function StudentGate({ onPick }: StudentGateProps) {
  // A returning classroom device skips the code step entirely: a remembered
  // join code resolves straight to the roster during the first render.
  const [joined, setJoined] = useState<JoinedClass | null>(() => {
    const last = lastJoinCode();
    if (!last) return null;
    const result = joinByCode(last);
    if (!result) clearLastClass();
    return result;
  });
  const [view, setView] = useState<GateView>(joined ? 'roster' : 'code');

  // --- student join state ---
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>(() =>
    joined ? listStudents(joined.classRoom.id) : [],
  );

  // --- teacher state ---
  const [auth, setAuth] = useState(() => getCurrentTeacher());
  const [schoolName, setSchoolName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [className, setClassName] = useState('');
  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [confirmDeleteClass, setConfirmDeleteClass] = useState<string | null>(null);

  // --- student add form (inside class detail) ---
  const [name, setName] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [avatar, setAvatar] = useState<TextureKey>(TextureKeys.PLAYER);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const join = () => {
    const result = joinByCode(code);
    if (!result) {
      setCodeError('Bu kodu tanımadık — öğretmeninden kontrol et.');
      return;
    }
    playSfx(SoundKeys.TICK, 0.7);
    setCodeError(null);
    setJoined(result);
    setStudents(listStudents(result.classRoom.id));
    setView('roster');
  };

  const openTeacher = () => {
    const current = getCurrentTeacher();
    setAuth(current);
    if (current) {
      setClasses(listClasses());
      setView('teacher');
    } else {
      setView('teacher-auth');
    }
  };

  const doLogin = () => {
    const teacher = loginTeacher(schoolName, teacherName);
    if (!teacher) {
      setAuthError('Okul adını ve kendi adını yaz.');
      return;
    }
    playSfx(SoundKeys.COMPLETE, 0.7);
    setAuthError(null);
    setAuth(getCurrentTeacher());
    setClasses(listClasses());
    setView('teacher');
  };

  const openClass = (classRoom: ClassRoom) => {
    setCurrentClass(classRoom);
    setStudents(listStudents(classRoom.id));
    setFormError(null);
    setView('class');
  };

  const submitClass = () => {
    const created = addClass(className);
    if (!created) return;
    playSfx(SoundKeys.COMPLETE, 0.7);
    setClassName('');
    setClasses(listClasses());
  };

  const submitStudent = () => {
    if (!currentClass) return;
    const created = addStudent(currentClass.id, { name, studentNo, avatar });
    if (!created) {
      setFormError(studentNo.trim() ? 'Bu numara sınıfta zaten var.' : 'Ad boş olamaz.');
      return;
    }
    playSfx(SoundKeys.COMPLETE, 0.7);
    setFormError(null);
    setName('');
    setStudentNo('');
    setStudents(listStudents(currentClass.id));
  };

  // ================= STUDENT: class code =================
  if (view === 'code') {
    return (
      <div className="gate-card" aria-label="Öğrenci girişi">
        <p className="startup-eyebrow">ÖĞRENCİ GİRİŞİ</p>
        <h2 className="profile-title gate-title">Sınıf kodunu gir</h2>
        <p className="gate-hint">Öğretmeninin verdiği kod — ör. <strong>5A-K7X2</strong></p>
        <input
          className="gate-code-input"
          type="text"
          placeholder="SINIF KODU"
          maxLength={12}
          value={code}
          autoFocus
          onChange={(e) => setCode(e.target.value.toLocaleUpperCase('tr'))}
          onKeyDown={(e) => e.key === 'Enter' && join()}
        />
        {codeError && <p className="gate-error" role="alert">{codeError}</p>}
        <button
          className="startup-button startup-button-primary"
          disabled={!code.trim()}
          onClick={join}
        >
          Sınıfa gir →
        </button>
        <button className="gate-link" onClick={openTeacher}>
          👩‍🏫 Öğretmen girişi
        </button>
      </div>
    );
  }

  // ================= STUDENT: class roster =================
  if (view === 'roster' && joined) {
    return (
      <div className="gate-card" aria-label="Sınıf listesi">
        <p className="startup-eyebrow">{joined.school.name} · {joined.classRoom.name}</p>
        <h2 className="profile-title gate-title">Kim oynuyor?</h2>
        {students.length === 0 ? (
          <p className="roster-empty">
            Bu sınıfta henüz öğrenci yok — öğretmenin seni eklemeli.
          </p>
        ) : (
          <div className="roster-grid" role="list">
            {students.map((student) => {
              const summary = sessionSummary(student.id);
              return (
                <button
                  key={student.id}
                  className="roster-card"
                  role="listitem"
                  onClick={() => {
                    playSfx(SoundKeys.TICK, 0.7);
                    onPick(student);
                  }}
                >
                  <AvatarFace textureKey={student.avatar} />
                  <strong>{student.name}</strong>
                  {student.studentNo && <span className="roster-no">No: {student.studentNo}</span>}
                  <em className={summary ? 'roster-stage saved' : 'roster-stage'}>
                    {summary ? `▶ ${QUEST_STAGE_LABELS[summary.quest]}` : 'Yeni oyun'}
                  </em>
                </button>
              );
            })}
          </div>
        )}
        <button
          className="gate-link"
          onClick={() => {
            clearLastClass();
            setJoined(null);
            setView('code');
          }}
        >
          ← Farklı sınıf kodu gir
        </button>
      </div>
    );
  }

  // ================= TEACHER: sign-in (mock, on the school's behalf) =================
  if (view === 'teacher-auth') {
    return (
      <div className="gate-card" aria-label="Öğretmen girişi">
        <p className="startup-eyebrow">ÖĞRETMEN GİRİŞİ</p>
        <h2 className="profile-title gate-title">Okulun adına giriş yap</h2>
        <label className="gate-field">
          <span>Okul</span>
          <input
            type="text"
            placeholder="Okul adı — ör. Atatürk İlkokulu"
            maxLength={48}
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            autoFocus
          />
        </label>
        <label className="gate-field">
          <span>Öğretmen</span>
          <input
            type="text"
            placeholder="Adın"
            maxLength={32}
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
          />
        </label>
        {authError && <p className="gate-error" role="alert">{authError}</p>}
        <button
          className="startup-button startup-button-primary"
          disabled={!schoolName.trim() || !teacherName.trim()}
          onClick={doLogin}
        >
          Giriş yap →
        </button>
        <button className="gate-link" onClick={() => setView('code')}>
          ← Öğrenci girişine dön
        </button>
      </div>
    );
  }

  // ================= TEACHER: class list =================
  if (view === 'teacher' && auth) {
    return (
      <div className="gate-card" aria-label="Öğretmen paneli">
        <p className="startup-eyebrow">ÖĞRETMEN PANELİ</p>
        <h2 className="profile-title gate-title">{auth.school.name}</h2>
        <p className="gate-hint">{auth.teacher.name} olarak giriş yaptın</p>

        <div className="gate-form">
          <input
            type="text"
            placeholder="Yeni sınıf — ör. 5-A"
            maxLength={16}
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitClass()}
          />
          <button
            className="startup-button startup-button-primary gate-inline-btn"
            disabled={!className.trim()}
            onClick={submitClass}
          >
            + Sınıf
          </button>
        </div>

        {classes.length === 0 ? (
          <p className="roster-empty">Henüz sınıfın yok — yukarıdan ilk sınıfını oluştur.</p>
        ) : (
          <ul className="teacher-list">
            {classes.map((classRoom) => (
              <li key={classRoom.id}>
                <button className="teacher-class-open" onClick={() => openClass(classRoom)}>
                  <strong>{classRoom.name}</strong>
                  <span className="join-code">{classRoom.joinCode}</span>
                  <em>{listStudents(classRoom.id).length} öğrenci</em>
                </button>
                <button
                  className="teacher-del"
                  aria-label={`${classRoom.name} sınıfını sil`}
                  onClick={() => {
                    if (confirmDeleteClass === classRoom.id) {
                      removeClass(classRoom.id);
                      setConfirmDeleteClass(null);
                      setClasses(listClasses());
                    } else {
                      setConfirmDeleteClass(classRoom.id);
                    }
                  }}
                  onBlur={() => setConfirmDeleteClass(null)}
                >
                  {confirmDeleteClass === classRoom.id ? 'Emin misin? Sil' : '✕'}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          className="gate-link"
          onClick={() => {
            logoutTeacher();
            setAuth(null);
            setView('teacher-auth');
          }}
        >
          Farklı öğretmen ile giriş
        </button>
        <button className="gate-link" onClick={() => setView('code')}>
          ← Öğrenci girişine dön
        </button>
      </div>
    );
  }

  // ================= TEACHER: class detail (roster management) =================
  if (view === 'class' && currentClass && auth) {
    return (
      <div className="gate-card" aria-label={`${currentClass.name} sınıfı`}>
        <p className="startup-eyebrow">{auth.school.name}</p>
        <h2 className="profile-title gate-title">{currentClass.name}</h2>
        <p className="gate-hint">
          Sınıf kodu: <strong className="join-code">{currentClass.joinCode}</strong> — öğrenciler
          bununla giriyor
        </p>

        <div className="gate-form">
          <input
            type="text"
            placeholder="Öğrenci adı soyadı"
            maxLength={32}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="No"
            maxLength={6}
            value={studentNo}
            onChange={(e) => setStudentNo(e.target.value)}
          />
        </div>

        <div className="avatar-grid" role="radiogroup" aria-label="Karakter seç">
          {AVATARS.map((key) => (
            <button
              key={key}
              type="button"
              className={`avatar-option${avatar === key ? ' picked' : ''}`}
              role="radio"
              aria-checked={avatar === key}
              aria-label={AVATAR_LABELS[key]}
              onClick={() => setAvatar(key)}
            >
              <AvatarFace textureKey={key} size={44} />
            </button>
          ))}
        </div>

        {formError && <p className="gate-error" role="alert">{formError}</p>}

        <button
          className="startup-button startup-button-primary"
          disabled={!name.trim()}
          onClick={submitStudent}
        >
          + Öğrenci ekle
        </button>

        {students.length > 0 && (
          <ul className="teacher-list">
            {students.map((student) => (
              <li key={student.id}>
                <span className="teacher-list-name">
                  {student.name}
                  {student.studentNo && <em> · {student.studentNo}</em>}
                  <em className="share-code"> · veli: {student.shareCode}</em>
                </span>
                <button
                  className="teacher-del"
                  aria-label={`${student.name} kaydını sil`}
                  onClick={() => {
                    if (confirmDelete === student.id) {
                      removeStudent(student.id);
                      setConfirmDelete(null);
                      setStudents(listStudents(currentClass.id));
                    } else {
                      setConfirmDelete(student.id);
                    }
                  }}
                  onBlur={() => setConfirmDelete(null)}
                >
                  {confirmDelete === student.id ? 'Emin misin? Sil' : '✕'}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          className="gate-link"
          onClick={() => {
            setClasses(listClasses());
            setView('teacher');
          }}
        >
          ← Sınıf listesine dön
        </button>
      </div>
    );
  }

  return null;
}
