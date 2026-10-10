import { useEffect, useRef, useState } from "react";
import { reducePhone } from "../logic.js";
import { createLessonPhone, EXTRA_LESSONS, extraGuidance, matchesExtraStep } from "../extraLessons.js";
import { silence, speak } from "../speech.js";
import Phone from "./Phone.jsx";
import { Icon, StepTrail } from "./LearningUI.jsx";

export default function ExtraLessonSession({ lessonId, mode = "tutorial", speechOn, onToggleSpeech, onBack, onDone, onPractice, onTown }) {
  const lesson = EXTRA_LESSONS[lessonId];
  const practice = mode === "practice";
  const [phone, setPhone] = useState(() => createLessonPhone(lessonId));
  const [alert, setAlert] = useState(null);
  const [history, setHistory] = useState([]);
  const [helpOn, setHelpOn] = useState(false);
  const recordedCompletion = useRef(false);
  const guidance = extraGuidance(phone);
  const spoken = guidance.complete
    ? lesson.success
    : practice
      ? [lesson.goal, helpOn ? `${guidance.title}. ${guidance.body}` : ""].filter(Boolean).join(" ")
      : `${guidance.title}. ${guidance.body}`;

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
      setAlert({ title: "Try a different button", message: action.type === "unsafe-link" ? "This link asks for card details and pressures you to act quickly. Leave it unopened and review the warning signs." : practice && !helpOn ? "That was not the next step. Tap Help me if you would like a hint." : guidance.body });
      return;
    }
    setHistory((previous) => [...previous, phone]);
    setPhone(reducePhone(phone, action));
    setAlert(null);
    setHelpOn(false);
  }

  function reset() {
    recordedCompletion.current = false;
    setPhone(createLessonPhone(lessonId));
    setHistory([]);
    setAlert(null);
    setHelpOn(false);
  }

  return (
    <section className="play">
      <div className="coach">
        <div className="control-row">
          <button className="secondary-btn" onClick={onBack}><Icon name="back" />Back</button>
          {practice ? null : <button className="secondary-btn" disabled={!history.length} onClick={() => {
            setPhone(history[history.length - 1]);
            setHistory(history.slice(0, -1));
            setAlert(null);
          }}><Icon name="previous" />Previous step</button>}
          <button className="secondary-btn" onClick={reset}><Icon name="restart" />Start over</button>
          {practice ? <button className="secondary-btn" onClick={() => setHelpOn(true)}><Icon name="help" />Help me</button> : null}
          <button className="secondary-btn" onClick={() => speak(spoken)}><Icon name="volume" />Hear this</button>
        </div>
        {practice ? null : <StepTrail step={guidance.step} total={lesson.steps.length} complete={guidance.complete} />}
        <p className="mode-kicker">{lesson.title} · {practice ? "Guided practice" : "Tutorial"}</p>
        <div className="instruction" aria-live="polite">
          {guidance.complete ? (
            <>
              <p className="step-count">✓ Done</p>
              <h2>{practice ? "You did it yourself" : "Tutorial complete"}</h2>
              <p>{lesson.success}</p>
              <div className="success-actions">
                {practice ? null : <button className="primary-btn" onClick={onPractice}>Try guided practice</button>}
                <button className={practice ? "primary-btn" : "secondary-btn"} onClick={onTown}>Back to lessons</button>
              </div>
            </>
          ) : practice ? (
            <>
              <h2>{lesson.title}</h2>
              <p>{lesson.goal} The buttons stay quiet unless you tap Help me.</p>
              {helpOn ? (
                <div className="hint-card">
                  <p className="step-count">Hint</p>
                  <h3>{guidance.title}</h3>
                  <p>{guidance.body}</p>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p className="step-count">Step {guidance.step} of {lesson.steps.length}</p>
              <h2>{guidance.title}</h2>
              <p>{guidance.body}</p>
            </>
          )}
        </div>
      </div>
      <Phone phone={phone} highlight={guidance.complete || (practice && !helpOn) ? null : guidance.target} alert={alert} speechOn={speechOn} onToggleSpeech={onToggleSpeech} onDismissAlert={() => setAlert(null)} onAction={dispatch} />
    </section>
  );
}
