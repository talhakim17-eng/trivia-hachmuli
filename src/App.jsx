import { useState, useEffect, useRef } from "react";
import level1 from "./questions-level1.json";
import level2 from "./questions-level2.json";
import level3 from "./questions-level3.json";
import level4 from "./questions-level4.json";
import level5 from "./questions-level5.json";

// ═══════════════════════════════════════════════════════════
// קונפיגורציה
// ═══════════════════════════════════════════════════════════
const TOTAL_QUESTIONS = 10;
const GAME_DURATION = 180;
const DIFFICULTY_LABELS = { 1: "קל", 2: "בינוני", 3: "מאתגר", 4: "קשה", 5: "גאון!" };
const DIFFICULTY_EMOJI = { 1: "🌱", 2: "🌿", 3: "🌳", 4: "🔥", 5: "🧠" };
const QUESTION_BANKS = { 1: level1, 2: level2, 3: level3, 4: level4, 5: level5 };

// ═══════════════════════════════════════════════════════════
// פונקציה לשליפת שאלות רנדומליות מהבנק
// ═══════════════════════════════════════════════════════════
function pickQuestions(level, count, usedIndices) {
  const bank = QUESTION_BANKS[level] || QUESTION_BANKS[2];
  // מסננים שאלות שכבר נשאלו
  const available = bank
    .map((q, i) => ({ ...q, _bankIndex: i }))
    .filter((q) => !usedIndices.has(q._bankIndex));

  // אם אין מספיק שאלות חדשות — מאפסים את ההיסטוריה
  if (available.length < count) {
    usedIndices.clear();
    return pickQuestions(level, count, usedIndices);
  }

  // ערבוב (Fisher-Yates)
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, count);
  // מסמנים את השאלות שנבחרו כ"שומשו"
  selected.forEach((q) => usedIndices.add(q._bankIndex));

  return selected.map(({ _bankIndex, ...q }) => q);
}

// ═══════════════════════════════════════════════════════════
// קומפוננטות UI
// ═══════════════════════════════════════════════════════════

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => {
    const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA", "#FF8C42", "#6BCB77"];
    return (
      <div key={i} style={{
        position: "fixed", top: -20, left: `${Math.random() * 100}%`,
        width: 6 + Math.random() * 8, height: (6 + Math.random() * 8) * 0.6,
        backgroundColor: colors[i % colors.length], borderRadius: 2,
        transform: `rotate(${Math.random() * 360}deg)`,
        animation: `confettiFall ${1.5 + Math.random()}s ease-in ${Math.random() * 0.5}s forwards`,
        zIndex: 1000,
      }} />
    );
  });
  return <>{pieces}</>;
}

function StartScreen({ onStart, difficulty, bankSize }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 30, textAlign: "center", direction: "rtl" }}>
      <div style={{ fontSize: 72, marginBottom: 12, animation: "bounce 2s ease-in-out infinite" }}>🧠</div>
      <h1 style={{ fontFamily: "'Rubik', sans-serif", fontSize: 42, fontWeight: 800, color: "#2D3436", margin: "0 0 8px 0", letterSpacing: -1 }}>חידון חכמולי</h1>
      <p style={{ fontFamily: "'Rubik', sans-serif", fontSize: 18, color: "#636E72", margin: "0 0 16px 0", lineHeight: 1.6 }}>
        10 שאלות ידע כללי מגוונות!<br />יש לכם 3 דקות ⏱️
      </p>
      <div style={{ fontFamily: "'Rubik', sans-serif", fontSize: 16, fontWeight: 700, color: "#6C5CE7", background: "#F0EDFF", padding: "8px 20px", borderRadius: 20, marginBottom: 8 }}>
        {DIFFICULTY_EMOJI[difficulty]} רמה: {DIFFICULTY_LABELS[difficulty]} ({difficulty}/5)
      </div>
      <div style={{ fontFamily: "'Rubik', sans-serif", fontSize: 12, color: "#999", marginBottom: 24 }}>
        📦 {bankSize} שאלות ברמה זו
      </div>
      <button onClick={onStart} style={{
        fontFamily: "'Rubik', sans-serif", fontSize: 22, fontWeight: 700, color: "white",
        background: "linear-gradient(135deg, #6C5CE7, #A78BFA)",
        border: "none", borderRadius: 16, padding: "16px 48px", cursor: "pointer",
        boxShadow: "0 8px 24px rgba(108, 92, 231, 0.35)", transition: "all 0.2s ease",
      }}
        onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px) scale(1.03)"; }}
        onMouseLeave={(e) => { e.target.style.transform = "translateY(0) scale(1)"; }}
      >🚀 יאללה, מתחילים!</button>
    </div>
  );
}

function QuestionScreen({ question, questionIndex, total, score, onAnswer, timeLeft, difficulty }) {
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (index) => {
    if (showResult) return;
    setSelected(index);
    setShowResult(true);
    setTimeout(() => { onAnswer(index === question.correct); setSelected(null); setShowResult(false); }, 2000);
  };

  const isCorrect = selected === question.correct;
  const progress = (questionIndex / total) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const isUrgent = timeLeft <= 30;
  const optionColors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA"];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", padding: "20px 24px", direction: "rtl", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, fontFamily: "'Rubik', sans-serif" }}>
        <span style={{ fontSize: 13, color: "#636E72", fontWeight: 600 }}>שאלה {questionIndex + 1} / {total}</span>
        <span style={{
          fontSize: 15, fontWeight: 800, fontFamily: "'Rubik', sans-serif",
          color: isUrgent ? "#FF6B6B" : "#2D3436", background: isUrgent ? "#FFF0F0" : "#F0F0F0",
          padding: "4px 12px", borderRadius: 20, minWidth: 58, textAlign: "center",
          animation: isUrgent ? "pulse 1s ease-in-out infinite" : "none",
        }}>⏱️ {timeStr}</span>
        <span style={{ fontSize: 13, color: "#6C5CE7", fontWeight: 700, background: "#F0EDFF", padding: "4px 10px", borderRadius: 20 }}>⭐ {score}</span>
      </div>
      <div style={{ textAlign: "center", fontFamily: "'Rubik', sans-serif", fontSize: 12, color: "#999", marginBottom: 8 }}>
        {DIFFICULTY_EMOJI[difficulty]} רמה {difficulty} — {DIFFICULTY_LABELS[difficulty]}
      </div>
      <div style={{ width: "100%", height: 6, backgroundColor: "#E8E8E8", borderRadius: 10, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #6C5CE7, #A78BFA)", borderRadius: 10, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ background: "white", borderRadius: 20, padding: "24px 20px", marginBottom: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.06)", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Rubik', sans-serif", fontSize: 22, fontWeight: 700, color: "#2D3436", margin: 0, lineHeight: 1.5 }}>{question.question}</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1 }}>
        {question.options.map((option, i) => {
          let bgColor = optionColors[i], textColor = "#2D3436", border = "none", opacity = 1;
          if (showResult) {
            if (i === question.correct) { bgColor = "#00B894"; textColor = "white"; border = "3px solid #00A381"; }
            else if (i === selected) { bgColor = "#FF7675"; textColor = "white"; border = "3px solid #E66767"; opacity = 0.9; }
            else { opacity = 0.4; }
          }
          return (
            <button key={i} onClick={() => handleSelect(i)} style={{
              fontFamily: "'Rubik', sans-serif", fontSize: 17, fontWeight: 600,
              color: textColor, backgroundColor: bgColor, border, borderRadius: 16,
              padding: "18px 10px", cursor: showResult ? "default" : "pointer",
              opacity, transition: "all 0.25s ease", display: "flex", alignItems: "center",
              justifyContent: "center", textAlign: "center", lineHeight: 1.3, minHeight: 64,
            }}>{option}</button>
          );
        })}
      </div>
      {showResult && (
        <div style={{ marginTop: 14, padding: "14px 18px", borderRadius: 14, background: isCorrect ? "#E8F8F5" : "#FFEAEA", textAlign: "center", fontFamily: "'Rubik', sans-serif", animation: "fadeIn 0.3s ease" }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: isCorrect ? "#00B894" : "#E17055" }}>
            {isCorrect ? "🎉 כל הכבוד!" : "😅 לא נורא!"}
          </div>
          <div style={{ fontSize: 14, color: "#636E72" }}>{question.explanation}</div>
        </div>
      )}
    </div>
  );
}

function EndScreen({ score, total, onRestart, timeUp, questionsAnswered, difficulty, newDifficulty }) {
  const percentage = questionsAnswered > 0 ? Math.round((score / questionsAnswered) * 100) : 0;
  let emoji, message;
  if (timeUp) { emoji = "⏰"; message = "נגמר הזמן!"; }
  else if (percentage === 100) { emoji = "🏆"; message = "מושלם! אתם גאונים!"; }
  else if (percentage >= 80) { emoji = "🌟"; message = "יופי! תוצאה מעולה!"; }
  else if (percentage >= 60) { emoji = "👍"; message = "לא רע! תנסו שוב!"; }
  else { emoji = "💪"; message = "תתאמנו ותשתפרו!"; }

  let diffChangeMsg, diffColor;
  if (newDifficulty > difficulty) { diffChangeMsg = "⬆️ עולים רמה! המשחק הבא יהיה יותר מאתגר"; diffColor = "#00B894"; }
  else if (newDifficulty < difficulty) { diffChangeMsg = "⬇️ יורדים רמה — בפעם הבאה יהיה קצת יותר קל"; diffColor = "#E17055"; }
  else { diffChangeMsg = "➡️ נשארים באותה רמה — בדיוק מתאים!"; diffColor = "#6C5CE7"; }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 30, textAlign: "center", direction: "rtl" }}>
      {percentage >= 80 && !timeUp && <Confetti />}
      <div style={{ fontSize: 80, marginBottom: 16, animation: "bounce 1.5s ease-in-out infinite" }}>{emoji}</div>
      <h1 style={{ fontFamily: "'Rubik', sans-serif", fontSize: 34, fontWeight: 800, color: "#2D3436", margin: "0 0 8px 0" }}>{message}</h1>
      <div style={{ fontFamily: "'Rubik', sans-serif", fontSize: 50, fontWeight: 800, color: "#6C5CE7", margin: "8px 0" }}>{score} / {questionsAnswered}</div>
      <p style={{ fontFamily: "'Rubik', sans-serif", fontSize: 16, color: "#636E72", margin: "0 0 8px 0" }}>
        ענית נכון על {score} מתוך {questionsAnswered} שאלות
        {timeUp && questionsAnswered < total && (<><br />({total - questionsAnswered} שאלות נשארו)</>)}
      </p>
      <div style={{ fontFamily: "'Rubik', sans-serif", fontSize: 15, fontWeight: 600, color: diffColor, background: "#F8F8FF", padding: "10px 20px", borderRadius: 14, marginBottom: 28, maxWidth: 320 }}>
        {diffChangeMsg}<br />
        <span style={{ fontSize: 13, color: "#999" }}>{DIFFICULTY_EMOJI[newDifficulty]} רמה הבאה: {DIFFICULTY_LABELS[newDifficulty]} ({newDifficulty}/5)</span>
      </div>
      <button onClick={onRestart} style={{
        fontFamily: "'Rubik', sans-serif", fontSize: 20, fontWeight: 700, color: "white",
        background: "linear-gradient(135deg, #6C5CE7, #A78BFA)",
        border: "none", borderRadius: 16, padding: "14px 44px", cursor: "pointer",
        boxShadow: "0 8px 24px rgba(108, 92, 231, 0.35)", transition: "all 0.2s ease",
      }}
        onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; }}
        onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; }}
      >🔄 שחקו שוב!</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// קומפוננטה ראשית
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("start");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [timeUp, setTimeUp] = useState(false);
  const [difficulty, setDifficulty] = useState(2);
  const [newDifficulty, setNewDifficulty] = useState(2);

  const difficultyRef = useRef(2);
  const scoreRef = useRef(0);
  const currentQRef = useRef(0);
  // שומר לכל רמה אילו אינדקסים כבר שומשו — בסט נפרד לכל רמה
  const usedIndicesRef = useRef({ 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() });

  // טיימר
  useEffect(() => {
    if (screen !== "playing") return;
    if (timeLeft <= 0) {
      setTimeUp(true);
      const next = calcNextDifficulty(difficultyRef.current, scoreRef.current);
      setNewDifficulty(next);
      setScreen("end");
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [screen, timeLeft]);

  function calcNextDifficulty(currentDiff, finalScore) {
    if (finalScore >= 8) return Math.min(5, currentDiff + 1);
    if (finalScore <= 5) return Math.max(1, currentDiff - 1);
    return currentDiff;
  }

  function startGame() {
    const level = difficultyRef.current;
    const selected = pickQuestions(level, TOTAL_QUESTIONS, usedIndicesRef.current[level]);

    setQuestions(selected);
    setCurrentQ(0);
    currentQRef.current = 0;
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(GAME_DURATION);
    setTimeUp(false);
    setScreen("playing");
  }

  function handleAnswer(isCorrect) {
    if (isCorrect) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
    const nextQ = currentQRef.current + 1;
    if (nextQ >= TOTAL_QUESTIONS) {
      setTimeout(() => {
        const next = calcNextDifficulty(difficultyRef.current, scoreRef.current);
        setNewDifficulty(next);
        setScreen("end");
      }, 300);
    } else {
      currentQRef.current = nextQ;
      setCurrentQ(nextQ);
    }
  }

  function handleRestart() {
    difficultyRef.current = newDifficulty;
    setDifficulty(newDifficulty);
    setScreen("start");
  }

  const bankSize = (QUESTION_BANKS[difficulty] || []).length;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #FAFAFA 0%, #F0EDFF 50%, #E8F8F5 100%)", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
      `}</style>

      {screen === "start" && <StartScreen onStart={startGame} difficulty={difficulty} bankSize={bankSize} />}
      {screen === "playing" && questions[currentQ] && (
        <QuestionScreen question={questions[currentQ]} questionIndex={currentQ} total={TOTAL_QUESTIONS}
          score={score} onAnswer={handleAnswer} timeLeft={timeLeft} difficulty={difficulty} />
      )}
      {screen === "end" && (
        <EndScreen score={score} total={TOTAL_QUESTIONS} onRestart={handleRestart} timeUp={timeUp}
          questionsAnswered={timeUp ? currentQ : currentQ + 1} difficulty={difficulty} newDifficulty={newDifficulty} />
      )}
    </div>
  );
}
