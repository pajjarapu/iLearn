import { useEffect, useRef, useState } from "react";
import { CALENDAR, CONTACTS, PHOTOS, contactById, photoById } from "../logic.js";
import { Avatar, PhotoArt } from "./art.jsx";

const APPS = [
  { id: "messages", label: "Messages", icon: "bubble", blurb: "Texts" },
  { id: "photos", label: "Photos", icon: "picture", blurb: "Saved pictures" },
  { id: "phone", label: "Phone", icon: "handset", blurb: "Calls" },
  { id: "camera", label: "Camera", icon: "camera", blurb: "New picture" },
  { id: "calendar", label: "Calendar", icon: "grid", blurb: "Dates" },
  { id: "settings", label: "Settings", icon: "sliders", blurb: "Phone choices" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Phone({ phone, highlight, speechOn, onToggleSpeech, onAction }) {
  const shellRef = useRef(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const root = shellRef.current;
    if (!root || !highlight) return;
    const target = root.querySelector(`[data-target="${CSS.escape(highlight)}"]`);
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [highlight, phone.screen, phone.contactId, phone.previewPhotoId, phone.day]);

  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const titles = {
    home: "Home",
    messages: "Messages",
    thread: contactById(phone.contactId)?.short ?? "Conversation",
    picker: "Choose a photo",
    preview: "Photo",
    photos: "Photos",
    "photo-view": "Saved photo",
    phone: "Phone",
    calling: "Calling",
    camera: "Camera",
    "camera-result": "Snapshot",
    calendar: CALENDAR.month,
    day: "Day",
    settings: "Settings",
    about: "About this phone",
  };

  return (
    <div className="stage">
      <p className="stage-caption">Practice phone. Nothing here is sent to a real person.</p>
      <div
        className="phone-bezel"
        ref={shellRef}
        style={{ fontSize: phone.textScale > 1 ? "1.12rem" : "1.05rem" }}
      >
        <div className="phone-screen">
          <div className="status-bar" aria-hidden="true">
            <span>Practice</span>
            <span>{time}</span>
            <span>{phone.textScale > 1 ? "Large text" : "TechTown"}</span>
          </div>
          <div className="phone-toolbar">
            <Tap id="back" highlight={highlight} className="chrome-btn" onClick={() => onAction({ type: "back" })}>
              Back
            </Tap>
            <h2 className="phone-title">{titles[phone.screen] ?? "Phone"}</h2>
            <Tap id="home" highlight={highlight} className="chrome-btn" onClick={() => onAction({ type: "home" })}>
              Home
            </Tap>
          </div>
          {phone.banner ? (
            <p className="phone-note" role="status">
              <strong>Note.</strong> {phone.banner}
            </p>
          ) : null}
          <div className="phone-body">
            {phone.screen === "home" ? <HomeScreen highlight={highlight} onAction={onAction} /> : null}
            {phone.screen === "messages" ? (
              <MessagesScreen phone={phone} highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "thread" ? (
              <ThreadScreen phone={phone} highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "picker" ? <PickerScreen highlight={highlight} onAction={onAction} /> : null}
            {phone.screen === "preview" ? (
              <PreviewScreen phone={phone} highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "photos" ? <PhotosScreen highlight={highlight} onAction={onAction} /> : null}
            {phone.screen === "photo-view" ? <PhotoViewScreen phone={phone} /> : null}
            {phone.screen === "phone" ? <CallsScreen highlight={highlight} onAction={onAction} /> : null}
            {phone.screen === "calling" ? (
              <CallingScreen phone={phone} highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "camera" ? <CameraScreen highlight={highlight} onAction={onAction} /> : null}
            {phone.screen === "camera-result" ? (
              <CameraResultScreen highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "calendar" ? (
              <CalendarScreen highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "day" ? <DayScreen phone={phone} /> : null}
            {phone.screen === "settings" ? (
              <SettingsScreen
                phone={phone}
                speechOn={speechOn}
                onToggleSpeech={onToggleSpeech}
                onAction={onAction}
              />
            ) : null}
            {phone.screen === "about" ? <AboutScreen /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tap({ id, highlight, className = "", children, onClick }) {
  const active = highlight === id;
  return (
    <button
      type="button"
      data-target={id}
      className={`${className} ${active ? "is-next" : ""}`.trim()}
      onClick={onClick}
    >
      {active ? (
        <span className="next-pill" aria-hidden="true">
          Tap here
        </span>
      ) : null}
      {children}
      {active ? <span className="sr-only"> Suggested next tap.</span> : null}
    </button>
  );
}

function HomeScreen({ highlight, onAction }) {
  return (
    <div className="home-screen">
      <p className="home-hello">Good to see you.</p>
      <p className="home-lead">Choose an app. Each name is written under its picture.</p>
      <div className="app-grid">
        {APPS.map((app) => (
          <Tap
            key={app.id}
            id={`app-${app.id}`}
            highlight={highlight}
            className="app-btn"
            onClick={() => onAction({ type: "open-app", app: app.id })}
          >
            <AppIcon name={app.icon} />
            <span className="app-label">{app.label}</span>
            <span className="app-blurb">{app.blurb}</span>
          </Tap>
        ))}
      </div>
    </div>
  );
}

function MessagesScreen({ phone, highlight, onAction }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const people = CONTACTS.filter((contact) => {
    if (!needle) return true;
    return (
      contact.name.toLowerCase().includes(needle) ||
      contact.relation.toLowerCase().includes(needle) ||
      contact.who.toLowerCase().includes(needle)
    );
  });

  return (
    <div>
      <label className="field">
        <span>Search</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a name"
        />
      </label>
      {query ? (
        <button type="button" className="text-btn" onClick={() => setQuery("")}>
          Clear search
        </button>
      ) : null}
      {people.length === 0 ? (
        <p className="phone-note">
          <strong>Note.</strong> No one on this practice phone matches that search. You can clear it and look for Maya.
        </p>
      ) : (
        <ul className="people">
          {people.map((contact) => {
            const last = phone.threads[contact.id][phone.threads[contact.id].length - 1];
            return (
              <li key={contact.id}>
                <Tap
                  id={`contact-${contact.id}`}
                  highlight={highlight}
                  className="person"
                  onClick={() => onAction({ type: "open-contact", contactId: contact.id })}
                >
                  <Avatar initials={contact.initials} pattern={contact.pattern} />
                  <span className="person-copy">
                    <span className="person-name">{contact.name}</span>
                    <span className="person-relation">{contact.relation}</span>
                    <span className="person-preview">{last?.text ?? contact.preview}</span>
                  </span>
                </Tap>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ThreadScreen({ phone, highlight, onAction }) {
  const contact = contactById(phone.contactId);
  const messages = phone.threads[phone.contactId] ?? [];
  const draft = phone.drafts[phone.contactId] ?? { text: "", photoId: null };
  const draftPhoto = photoById(draft.photoId);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (!contact) return null;

  return (
    <div className="thread">
      <p className="thread-who">
        {contact.name}
        <span>{contact.relation}</span>
      </p>
      <ol className="bubbles">
        {messages.map((message) => {
          const photo = photoById(message.photoId);
          return (
            <li key={message.id} className={message.from === "me" ? "mine" : "theirs"}>
              <span className="bubble-kicker">{message.from === "me" ? "You" : contact.short}</span>
              {photo ? (
                <figure className="bubble-photo">
                  <PhotoArt id={photo.id} />
                  <figcaption>{photo.label}</figcaption>
                </figure>
              ) : null}
              {message.text ? <p>{message.text}</p> : null}
            </li>
          );
        })}
        <li ref={endRef} />
      </ol>
      {draftPhoto ? (
        <div className="draft-photo">
          <PhotoArt id={draftPhoto.id} />
          <div>
            <p>
              <strong>Attached.</strong> {draftPhoto.label}
            </p>
            <p>It is not delivered until you tap Send.</p>
            <Tap
              id="remove-draft"
              highlight={highlight}
              className="text-btn"
              onClick={() => onAction({ type: "remove-draft" })}
            >
              Remove photo
            </Tap>
          </div>
        </div>
      ) : null}
      <div className="composer">
        <Tap
          id="attach"
          highlight={highlight}
          className="composer-photo"
          onClick={() => onAction({ type: "open-picker" })}
        >
          <AppIcon name="picture" />
          Photo
        </Tap>
        <label className="field grow">
          <span>Message</span>
          <input
            value={draft.text}
            onChange={(event) => onAction({ type: "set-text", text: event.target.value })}
            placeholder="Write a few words, if you want"
          />
        </label>
        <Tap id="send" highlight={highlight} className="send-btn" onClick={() => onAction({ type: "send" })}>
          Send
        </Tap>
      </div>
    </div>
  );
}

function PickerScreen({ highlight, onAction }) {
  return (
    <div>
      <p className="home-lead">Tap a picture. The words under it tell you what it is.</p>
      <div className="photo-grid">
        {PHOTOS.map((photo) => (
          <Tap
            key={photo.id}
            id={`photo-${photo.id}`}
            highlight={highlight}
            className="photo-card"
            onClick={() => onAction({ type: "preview-photo", photoId: photo.id })}
          >
            <PhotoArt id={photo.id} />
            <span className="photo-label">{photo.label}</span>
          </Tap>
        ))}
      </div>
    </div>
  );
}

function PreviewScreen({ phone, highlight, onAction }) {
  const photo = photoById(phone.previewPhotoId);
  if (!photo) return null;
  return (
    <div className="preview">
      <PhotoArt id={photo.id} />
      <h3>{photo.label}</h3>
      <p>{photo.detail}</p>
      <Tap
        id="use-photo"
        highlight={highlight}
        className="primary-phone"
        onClick={() => onAction({ type: "use-photo" })}
      >
        Use this photo
      </Tap>
      <Tap
        id="choose-another"
        highlight={highlight}
        className="secondary-phone"
        onClick={() => onAction({ type: "back" })}
      >
        Choose another
      </Tap>
    </div>
  );
}

function PhotosScreen({ highlight, onAction }) {
  return (
    <div>
      <p className="home-lead">These pictures stay on the phone. Looking at them does not send them.</p>
      <div className="photo-grid">
        {PHOTOS.map((photo) => (
          <Tap
            key={photo.id}
            id={`library-${photo.id}`}
            highlight={highlight}
            className="photo-card"
            onClick={() => onAction({ type: "preview-photo", photoId: photo.id })}
          >
            <PhotoArt id={photo.id} />
            <span className="photo-label">{photo.label}</span>
          </Tap>
        ))}
      </div>
    </div>
  );
}

function PhotoViewScreen({ phone }) {
  const photo = photoById(phone.previewPhotoId);
  if (!photo) return null;
  return (
    <div className="preview">
      <PhotoArt id={photo.id} />
      <h3>{photo.label}</h3>
      <p>{photo.detail}</p>
      <p>This is only for looking. To send a picture, use Messages.</p>
    </div>
  );
}

function CallsScreen({ highlight, onAction }) {
  return (
    <ul className="people">
      {CONTACTS.map((contact) => (
        <li key={contact.id}>
          <Tap
            id={`call-${contact.id}`}
            highlight={highlight}
            className="person"
            onClick={() => onAction({ type: "call", contactId: contact.id })}
          >
            <Avatar initials={contact.initials} pattern={contact.pattern} />
            <span className="person-copy">
              <span className="person-name">Call {contact.short}</span>
              <span className="person-relation">{contact.relation}</span>
            </span>
          </Tap>
        </li>
      ))}
    </ul>
  );
}

function CallingScreen({ phone, highlight, onAction }) {
  const contact = contactById(phone.contactId);
  return (
    <div className="center-card">
      {contact ? <Avatar initials={contact.initials} pattern={contact.pattern} /> : null}
      <h3>Calling {contact?.name ?? "someone"}</h3>
      <p>This is a practice call. No real phone will ring.</p>
      <Tap
        id="end-call"
        highlight={highlight}
        className="primary-phone"
        onClick={() => onAction({ type: "end-call" })}
      >
        End call
      </Tap>
    </div>
  );
}

function CameraScreen({ highlight, onAction }) {
  return (
    <div className="center-card">
      <div className="viewfinder">
        <PhotoArt id="snapshot" />
      </div>
      <p>The shutter takes a new picture. It does not open the pictures you already have.</p>
      <Tap id="shutter" highlight={highlight} className="primary-phone" onClick={() => onAction({ type: "shutter" })}>
        Take photo
      </Tap>
    </div>
  );
}

function CameraResultScreen({ highlight, onAction }) {
  return (
    <div className="preview">
      <PhotoArt id="snapshot" />
      <h3>Practice snapshot</h3>
      <p>Saved only inside this camera. It is not added to the lesson photos.</p>
      <Tap
        id="retake"
        highlight={highlight}
        className="secondary-phone"
        onClick={() => onAction({ type: "retake" })}
      >
        Take another
      </Tap>
    </div>
  );
}

function CalendarScreen({ highlight, onAction }) {
  const blanks = Array.from({ length: CALENDAR.startWeekday }, (_, index) => index);
  const days = Array.from({ length: CALENDAR.days }, (_, index) => index + 1);
  return (
    <div>
      <p className="home-lead">Tap a day, or choose an event from the list.</p>
      <div className="weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {blanks.map((item) => (
          <span key={`blank-${item}`} />
        ))}
        {days.map((day) => {
          const event = CALENDAR.events[day];
          return (
            <Tap
              key={day}
              id={`day-${day}`}
              highlight={highlight}
              className="day-btn"
              onClick={() => onAction({ type: "open-day", day })}
            >
              <span className="day-num">{day}</span>
              {day === CALENDAR.today ? <span className="day-tag">Today</span> : null}
              {event ? <span className="day-tag">Event</span> : null}
            </Tap>
          );
        })}
      </div>
      <h3 className="section-label">Events</h3>
      <ul className="people">
        {Object.entries(CALENDAR.events).map(([day, event]) => (
          <li key={day}>
            <Tap
              id={`event-${day}`}
              highlight={highlight}
              className="person"
              onClick={() => onAction({ type: "open-day", day: Number(day) })}
            >
              <span className="person-copy">
                <span className="person-name">{event.title}</span>
                <span className="person-relation">October {day}</span>
              </span>
            </Tap>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DayScreen({ phone }) {
  const event = CALENDAR.events[phone.day];
  const weekday = WEEKDAYS[(CALENDAR.startWeekday + phone.day - 1) % 7];
  return (
    <div className="center-card">
      <h3>
        {weekday}, October {phone.day}
      </h3>
      {phone.day === CALENDAR.today ? <p>This day is marked Today.</p> : null}
      {event ? (
        <>
          <p>
            <strong>{event.title}.</strong>
          </p>
          <p>{event.detail}</p>
        </>
      ) : (
        <p>Nothing is planned for this day on the practice phone.</p>
      )}
    </div>
  );
}

function SettingsScreen({ phone, speechOn, onToggleSpeech, onAction }) {
  return (
    <div className="settings-list">
      <button type="button" className="settings-row" onClick={() => onAction({ type: "toggle-scale" })}>
        <span>Larger phone text</span>
        <strong>{phone.textScale > 1 ? "On" : "Off"}</strong>
      </button>
      <button type="button" className="settings-row" onClick={onToggleSpeech}>
        <span>Spoken instructions</span>
        <strong>{speechOn ? "On" : "Off"}</strong>
      </button>
      <button type="button" className="settings-row" onClick={() => onAction({ type: "open-app", app: "about" })}>
        <span>About this phone</span>
        <strong>Open</strong>
      </button>
    </div>
  );
}

function AboutScreen() {
  return (
    <div className="center-card">
      <h3>A practice phone</h3>
      <p>
        This phone lives inside TechTown. Nothing you tap here sends a real message, places a real call, or
        changes the phone you own.
      </p>
    </div>
  );
}

function AppIcon({ name }) {
  return (
    <svg className="app-icon" viewBox="0 0 48 48" aria-hidden="true">
      {name === "bubble" ? (
        <>
          <rect x="6" y="8" width="36" height="26" rx="8" fill="none" stroke="#1c1612" strokeWidth="3" />
          <path d="M16 34 l-2 8 10-8" fill="none" stroke="#1c1612" strokeWidth="3" />
        </>
      ) : null}
      {name === "picture" ? (
        <>
          <rect x="7" y="10" width="34" height="28" rx="4" fill="none" stroke="#1c1612" strokeWidth="3" />
          <circle cx="18" cy="20" r="3" fill="#1c1612" />
          <path d="M10 32 l10-8 6 5 5-4 7 7" fill="none" stroke="#1c1612" strokeWidth="3" />
        </>
      ) : null}
      {name === "handset" ? (
        <path
          d="M16 10 h6 l3 8-4 3 a12 12 0 0 0 6 6 l3-4 8 3 v6 c-12 2-22-8-24-22 z"
          fill="none"
          stroke="#1c1612"
          strokeWidth="3"
        />
      ) : null}
      {name === "camera" ? (
        <>
          <rect x="6" y="14" width="36" height="24" rx="4" fill="none" stroke="#1c1612" strokeWidth="3" />
          <circle cx="24" cy="26" r="6" fill="none" stroke="#1c1612" strokeWidth="3" />
          <path d="M16 14 l3-5 h10 l3 5" fill="none" stroke="#1c1612" strokeWidth="3" />
        </>
      ) : null}
      {name === "grid" ? (
        <>
          <rect x="8" y="10" width="32" height="28" rx="3" fill="none" stroke="#1c1612" strokeWidth="3" />
          <path d="M8 18 h32 M20 18 v20 M32 18 v20" stroke="#1c1612" strokeWidth="3" />
        </>
      ) : null}
      {name === "sliders" ? (
        <>
          <path d="M10 16 h28 M10 24 h28 M10 32 h28" stroke="#1c1612" strokeWidth="3" />
          <circle cx="18" cy="16" r="3" fill="#fbf7f1" stroke="#1c1612" strokeWidth="3" />
          <circle cx="30" cy="24" r="3" fill="#fbf7f1" stroke="#1c1612" strokeWidth="3" />
          <circle cx="20" cy="32" r="3" fill="#fbf7f1" stroke="#1c1612" strokeWidth="3" />
        </>
      ) : null}
    </svg>
  );
}
