import { useEffect, useRef, useState } from "react";
import { reducePhone } from "../logic.js";
import { createLessonPhone, EXTRA_LESSONS, extraGuidance, matchesExtraStep } from "../extraLessons.js";
import { silence, speak } from "../speech.js";
import Phone from "./Phone.jsx";
import { StepTrail } from "./LearningUI.jsx";

export default function ExtraLessonSession({ lessonId, speechOn, onToggleSpeech, onBack, onDone, onTown }) {
  const lesson = EXTRA_LESSONS[lessonId];
  const [phone, setPhone] = useState(() => createLessonPhone(lessonId));
  const [alert, setAlert] = useState(null);
  const [history, setHistory] = useState([]);
  const recordedCompletion = useRef(false);
  const guidance = extraGuidance(phone);
  const spoken = guidance.complete ? lesson.success : `${guidance.title}. ${guidance.body}`;

  useEffect(() => {
    if (speechOn) speak(spoken);
    else silence();
    return () => silence();
  }, [speechOn, spoken]);

  useEffect(() => {
    if (guidance.complete && !recordedCompletion.current) {
      recordedCompletion.current = true;
      onDone();
    }
  }, [guidance.complete, onDone]);

  function dispatch(action) {
    if (guidance.complete) return;
    if (action.type === "back" && ["call-contact", "safety-message", "safety-report"].includes(phone.screen)) {
      setPhone(reducePhone(phone, action));
      setAlert(null);
      return;
    }
    if (!matchesExtraStep(guidance, action)) {
      setAlert({ title: "Try a different button", message: action.type === "unsafe-link" ? "This link asks for card details and pressures you to act quickly. Leave it unopened and review the warning signs." : guidance.body });
      return;
    }
    setHistory((previous) => [...previous, phone]);
    setPhone(reducePhone(phone, action));
    setAlert(null);
  }

  function reset() {
    recordedCompletion.current = false;
    setPhone(createLessonPhone(lessonId));
    setHistory([]);
    setAlert(null);
  }

  return (
    <section className="play">
      <div className="coach">
        <div className="control-row">
          <button className="secondary-btn" onClick={onBack}>Back</button>
          <button className="secondary-btn" disabled={!history.length} onClick={() => {
            setPhone(history[history.length - 1]);
            setHistory(history.slice(0, -1));
            setAlert(null);
          }}>Previous step</button>
          <button className="secondary-btn" onClick={reset}>Start over</button>
          <button className="secondary-btn" onClick={() => speak(spoken)}>Hear this</button>
        </div>
        <StepTrail step={guidance.step} total={lesson.steps.length} complete={guidance.complete} />
        <p className="mode-kicker">{lesson.title} · Tutorial</p>
        <div className="instruction" aria-live="polite">
          <p className="step-count">{guidance.complete ? "✓ Done" : `Step ${guidance.step} of ${lesson.steps.length}`}</p>
          <h2>{guidance.complete ? "Tutorial complete" : guidance.title}</h2>
          <p>{guidance.complete ? lesson.success : guidance.body}</p>
          {guidance.complete ? <button className="primary-btn" onClick={onTown}>Back to lessons</button> : null}
        </div>
      </div>
      <Phone phone={phone} highlight={guidance.complete ? null : guidance.target} alert={alert} speechOn={speechOn} onToggleSpeech={onToggleSpeech} onDismissAlert={() => setAlert(null)} onAction={dispatch} />
    </section>
  );
}
