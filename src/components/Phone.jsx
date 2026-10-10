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

const HOME_APPS = APPS.filter((app) => !["messages", "phone"].includes(app.id));
const DOCK_APPS = APPS.filter((app) => ["messages", "phone"].includes(app.id));

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CONVO_TIMESTAMPS = {
  maya: "9:41 AM",
  luis: "Yesterday",
  sam: "9:15 AM",
  patel: "8:50 AM",
  rosa: "Mon",
};

export default function Phone({ phone, highlight, alert, speechOn, onToggleSpeech, onDismissAlert, onAction }) {
  const shellRef = useRef(null);

  useEffect(() => {
    const root = shellRef.current;
    if (!root || !highlight) return;
    const target = root.querySelector(`[data-target="${CSS.escape(highlight)}"]`);
    if (!target) return;
    const scroller = target.closest(".photo-grid-picker, .bubbles, .phone-body");
    if (!scroller || !root.contains(scroller)) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const isVisible = targetRect.top >= scrollerRect.top && targetRect.bottom <= scrollerRect.bottom;
    if (isVisible) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const centeredTop =
      scroller.scrollTop +
      targetRect.top -
      scrollerRect.top -
      (scrollerRect.height - targetRect.height) / 2;
    scroller.scrollTo({ top: centeredTop, behavior: reduce ? "auto" : "smooth" });
  }, [highlight, phone.screen, phone.contactId, phone.previewPhotoId, phone.day]);

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
    reminder: "Reminder",
    settings: "Settings",
    about: "About this phone",
  };

  return (
    <div className="stage">
      <p className="stage-caption">Practice phone. Nothing here is sent to a real person.</p>
      <div
        className="phone-bezel"
        ref={shellRef}
        style={{ fontSize: phone.textScale > 1 ? "19px" : "17px" }}
      >
        <div className={`phone-screen screen-${phone.screen} ${phone.screen === "picker" ? "picker-active" : ""}`.trim()}>
          <div className="status-bar" aria-hidden="true">
            <span className="status-time">
              9:41
              <span className="location-arrow" />
            </span>
            <span className="dynamic-island">
              <span className="island-indicator" />
              <span className="island-camera" />
            </span>
            <span className="status-right">
              <span className="cellular-icon"><i /><i /><i /><i /></span>
              <span className="wifi-icon" />
              <span className="battery"><span className="battery-level" /></span>
            </span>
          </div>
          {!['home', 'messages', 'thread', 'picker'].includes(phone.screen) ? (
            <div className="phone-toolbar">
              <Tap id="back" highlight={highlight} className="chrome-btn" onClick={() => onAction({ type: "back" })}>
                Back
              </Tap>
              <h2 className="phone-title">{titles[phone.screen] ?? "Phone"}</h2>
              <Tap id="home" highlight={highlight} className="chrome-btn" onClick={() => onAction({ type: "home" })}>
                Home
              </Tap>
            </div>
          ) : null}
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
            {phone.screen === "picker" ? (
              <div className="picker-layout">
                <ThreadScreen phone={phone} highlight={highlight} onAction={onAction} />
                <PickerScreen phone={phone} highlight={highlight} onAction={onAction} />
              </div>
            ) : null}
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
            {phone.screen === "day" ? (
              <DayScreen phone={phone} highlight={highlight} onAction={onAction} />
            ) : null}
            {phone.screen === "reminder" ? (
              <ReminderScreen phone={phone} highlight={highlight} onAction={onAction} />
            ) : null}
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
          <div className="home-indicator" aria-hidden="true">
            <span />
          </div>
          {alert ? (
            <div className="phone-alert-backdrop">
              <div className="phone-alert" role="alertdialog" aria-modal="true" aria-labelledby="phone-alert-title">
                <span className="phone-alert-icon" aria-hidden="true">!</span>
                <h3 id="phone-alert-title">{alert.title}</h3>
                <p>{alert.message}</p>
                <button type="button" className="phone-alert-action" onClick={onDismissAlert}>
                  Try again
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Tap({ id, highlight, className = "", children, onClick, ariaLabel, disabled }) {
  const active = highlight === id;
  return (
    <button
      type="button"
      data-target={id}
      className={`${className} ${active ? "is-next" : ""}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
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
      <p className="sr-only">Choose an app. Each name is written under its picture.</p>
      <div className="app-grid">
        {HOME_APPS.map((app) => (
          <Tap
            key={app.id}
            id={`app-${app.id}`}
            highlight={highlight}
            className={`app-btn app-${app.id}`}
            onClick={() => onAction({ type: "open-app", app: app.id })}
          >
            <AppIcon name={app.icon} />
            <span className="app-label">{app.label}</span>
            <span className="app-blurb">{app.blurb}</span>
          </Tap>
        ))}
      </div>
      <div className="home-search" aria-hidden="true">
        <span>⌕</span> Search
      </div>
      <div className="home-dock" aria-label="Dock">
        {DOCK_APPS.map((app) => (
          <Tap
            key={app.id}
            id={`app-${app.id}`}
            highlight={highlight}
            className={`app-btn app-${app.id}`}
            onClick={() => onAction({ type: "open-app", app: app.id })}
            ariaLabel={app.label}
          >
            <AppIcon name={app.icon} />
            <span className="app-label">{app.label}</span>
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
    <div className="messages-screen">
      <header className="messages-header">
        <h2>Messages</h2>
        <Tap id="compose" highlight={highlight} className="compose-btn" onClick={() => onAction({ type: "messages" })}>
          ✎
        </Tap>
      </header>

      <label className="search-field" aria-label="Search messages">
        <span aria-hidden="true">⌕</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
        />
      </label>

      {query ? (
        <button type="button" className="text-btn clear-search" onClick={() => setQuery("")}>
          Clear search
        </button>
      ) : null}

      {people.length === 0 ? (
        <p className="phone-note">
          <strong>Note.</strong> No one on this practice phone matches that search. You can clear it and look for Maya.
        </p>
      ) : (
        <ul className="conversation-list">
          {people.map((contact) => {
            const last = phone.threads[contact.id][phone.threads[contact.id].length - 1];
            const unread = contact.id === "maya" && last?.from === "them";
            return (
              <li key={contact.id}>
                <Tap
                  id={`contact-${contact.id}`}
                  highlight={highlight}
                  className={`conversation-item ${unread ? "unread" : ""}`.trim()}
                  onClick={() => onAction({ type: "open-contact", contactId: contact.id })}
                >
                  <Avatar initials={contact.initials} pattern={contact.pattern} />
                  <div className="conversation-copy">
                    <div className="conversation-meta">
                      <span className="person-name">{contact.name}</span>
                      <time>{CONVO_TIMESTAMPS[contact.id] ?? "Now"}</time>
                    </div>
                    <div className="conversation-preview-row">
                      <span className="person-preview">{last?.text ?? contact.preview}</span>
                      {unread ? <span className="unread-dot" aria-label="Unread message" /> : null}
                    </div>
                  </div>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const lastOutgoing = [...messages].reverse().find((message) => message.from === "me");
  const sendReady = Boolean(draft.text.trim() || draftPhoto);

  useEffect(() => {
    const end = endRef.current;
    if (!end) return;
    const bubbles = end.previousElementSibling;
    const scroller = phone.screen === "picker" && bubbles?.classList.contains("bubbles")
      ? bubbles
      : end.closest(".phone-body");
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [messages.length, phone.screen]);

  if (!contact) return null;

  return (
    <div className="thread">
      <header className="conversation-header">
        <Tap id="back" highlight={highlight} className="back-btn" onClick={() => onAction({ type: "back" })} ariaLabel="Back to Messages">
          <span aria-hidden="true">‹</span>
          <span className="back-count" aria-hidden="true">1</span>
        </Tap>
        <div className="thread-user">
          <Avatar initials={contact.initials} pattern={contact.pattern} />
          <span className="thread-contact-copy">
            <span className="thread-name">{contact.name}<span className="contact-chevron" aria-hidden="true">›</span></span>
            <span className="thread-relation">{contact.relation}</span>
          </span>
        </div>
        <span className="video-call" role="img" aria-label="Video call unavailable in this practice phone">
          <svg viewBox="0 0 32 24" aria-hidden="true">
            <rect x="2" y="4" width="19" height="16" rx="4" />
            <path d="M21 9l8-4v14l-8-4z" />
          </svg>
        </span>
      </header>

      <ol className="bubbles">
        {messages.map((message, index) => {
          const photo = photoById(message.photoId);
          const isMine = message.from === "me";
          const showStatus = isMine && index === messages.length - 1;
          return (
            <li key={message.id} className={isMine ? "mine" : "theirs"}>
              {photo ? (
                <figure className="bubble-photo">
                  <PhotoArt id={photo.id} />
                  <figcaption>{photo.label}</figcaption>
                </figure>
              ) : null}
              {message.text ? <p>{message.text}</p> : null}
              {showStatus ? <span className="message-status">Delivered</span> : null}
            </li>
          );
        })}
      </ol>
      <div ref={endRef} className="message-end" aria-hidden="true" />

      <div className="composer">
        <div className="attachment-wrap">
          <Tap
            id="attach"
            highlight={highlight}
            className="composer-photo"
            onClick={() => setMenuOpen((open) => !open)}
          >
            +
          </Tap>
          {menuOpen ? (
            <div className="attachment-menu" role="menu" aria-label="Attachment options">
              {[
                { label: "Camera", icon: "◉", style: "camera" },
                { label: "Photos", icon: "✿", style: "photos", active: true },
                { label: "Stickers", icon: "◕", style: "stickers" },
                { label: "Apple Cash", icon: "$", style: "cash" },
                { label: "Polls", icon: "☰", style: "polls" },
                { label: "Audio", icon: "Ⅱ", style: "audio" },
                { label: "Store", icon: "A", style: "store" },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  className={`attachment-option ${option.active && highlight === "attach" ? "is-next attachment-photos-target" : ""}`.trim()}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onAction(
                      option.active
                        ? { type: "open-picker" }
                        : { type: "unsupported-attachment", label: option.label },
                    );
                  }}
                >
                  <span className={`attachment-icon ${option.style}`} aria-hidden="true">{option.icon}</span>
                  <span>{option.label}</span>
                  {option.active && highlight === "attach" ? (
                    <span className="attachment-tap-pill" aria-hidden="true">Tap here</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="composer-input-wrap">
          {draftPhoto ? (
            <div className="draft-photo-inline">
              <div className="draft-photo-wrap">
                <PhotoArt id={draftPhoto.id} />
                <Tap
                  id="remove-draft"
                  highlight={highlight}
                  className="remove-draft"
                  onClick={() => onAction({ type: "remove-draft" })}
                  ariaLabel="Remove photo"
                >
                  ×
                </Tap>
              </div>
            </div>
          ) : null}

          <label className="field grow composer-field">
            <span className="sr-only">Message</span>
            <input
              value={draft.text}
              onChange={(event) => onAction({ type: "set-text", text: event.target.value })}
              placeholder={draftPhoto ? "" : "iMessage"}
            />
          </label>
        </div>

        <Tap
          id="send"
          highlight={highlight}
          className={`send-btn ${sendReady ? "ready" : ""}`.trim()}
          onClick={() => onAction({ type: "send" })}
            ariaLabel={sendReady ? "Send message" : "Send message, unavailable until you add content"}
            disabled={!sendReady}
        >
            <span aria-hidden="true">↑</span>
        </Tap>
      </div>
    </div>
  );
}

function PickerScreen({ highlight, onAction }) {
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);

  return (
    <div className="photo-picker">
      <div className="photo-picker-toolbar">
        <span className="picker-album">Photos</span>
        <span className="picker-count">Select a photo</span>
        <span className="picker-spacer" aria-hidden="true" />
      </div>
      <div className="photo-grid photo-grid-picker">
        {PHOTOS.map((photo) => {
          const isTutorialTarget = highlight === `photo-${photo.id}`;
          const isSelected = selectedPhotoId === photo.id;
          return (
            <button
              key={photo.id}
              type="button"
              className={`photo-tile ${isTutorialTarget ? "tutorial-target" : ""} ${isSelected ? "selected" : ""}`.trim()}
              aria-label={`${photo.label}${isTutorialTarget ? ", suggested next photo" : ""}`}
              aria-pressed={isSelected}
              onClick={() => {
                setSelectedPhotoId(photo.id);
                onAction({ type: "select-photo", photoId: photo.id });
              }}
            >
              <PhotoArt id={photo.id} />
              {isTutorialTarget ? (
                <span className="photo-tutorial-label" aria-hidden="true">Tap Garden flowers</span>
              ) : null}
              <span className="photo-selection" aria-hidden="true">{isSelected ? "✓" : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewScreen({ phone, highlight, onAction }) {
  const photo = photoById(phone.previewPhotoId);
  if (!photo) return null;
  return (
    <div className="preview preview-sheet">
      <div className="preview-header">
        <Tap id="close-preview" highlight={highlight} className="sheet-close light" onClick={() => onAction({ type: "back" })}>
          ×
        </Tap>
        <span className="photo-sheet-title">{photo.label}</span>
        <span className="sheet-spacer" aria-hidden="true" />
      </div>
      <div className="preview-image-wrap">
        <PhotoArt id={photo.id} />
      </div>
      <div className="preview-meta">
        <p>{photo.detail}</p>
      </div>
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

function DayScreen({ phone, highlight, onAction }) {
  const event = CALENDAR.events[phone.day];
  const weekday = WEEKDAYS[(CALENDAR.startWeekday + phone.day - 1) % 7];
  const reminder = phone.reminders[phone.day];
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
          {reminder ? (
            <p className="calendar-reminder-saved" role="status">
              <strong>Reminder:</strong> {reminder}
            </p>
          ) : null}
          <Tap
            id="add-reminder"
            highlight={highlight}
            className="primary-phone calendar-reminder-button"
            onClick={() => onAction({ type: "open-reminder" })}
          >
            {reminder ? "Change reminder" : "Add reminder"}
          </Tap>
        </>
      ) : (
        <p>Nothing is planned for this day on the practice phone.</p>
      )}
    </div>
  );
}

function ReminderScreen({ phone, highlight, onAction }) {
  const choices = ["At time of event", "1 hour before", "1 day before"];
  return (
    <div className="reminder-screen">
      <p className="home-lead">Choose when the phone should remind you about Book club.</p>
      <div className="settings-list reminder-options">
        {choices.map((choice) => (
          <Tap
            key={choice}
            id={choice === "1 day before" ? "reminder-day-before" : `reminder-${choice}`}
            highlight={highlight}
            className={`settings-row ${phone.reminderDraft === choice ? "selected" : ""}`.trim()}
            onClick={() => onAction({ type: "select-reminder", value: choice })}
          >
            <span>{choice}</span>
            <span aria-hidden="true">{phone.reminderDraft === choice ? "✓" : ""}</span>
          </Tap>
        ))}
      </div>
      <Tap
        id="save-reminder"
        highlight={highlight}
        className="primary-phone reminder-save"
        onClick={() => onAction({ type: "save-reminder" })}
        disabled={!phone.reminderDraft}
      >
        Done
      </Tap>
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
          <rect x="6" y="8" width="36" height="26" rx="8" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M16 34 l-2 8 10-8" fill="none" stroke="currentColor" strokeWidth="3" />
        </>
      ) : null}
      {name === "picture" ? (
        <>
          <rect x="7" y="10" width="34" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="18" cy="20" r="3" fill="currentColor" />
          <path d="M10 32 l10-8 6 5 5-4 7 7" fill="none" stroke="currentColor" strokeWidth="3" />
        </>
      ) : null}
      {name === "handset" ? (
        <path
          d="M16 10 h6 l3 8-4 3 a12 12 0 0 0 6 6 l3-4 8 3 v6 c-12 2-22-8-24-22 z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      ) : null}
      {name === "camera" ? (
        <>
          <rect x="6" y="14" width="36" height="24" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="24" cy="26" r="6" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M16 14 l3-5 h10 l3 5" fill="none" stroke="currentColor" strokeWidth="3" />
        </>
      ) : null}
      {name === "grid" ? (
        <>
          <rect x="8" y="10" width="32" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M8 18 h32 M20 18 v20 M32 18 v20" stroke="currentColor" strokeWidth="3" />
        </>
      ) : null}
      {name === "sliders" ? (
        <>
          <path d="M10 16 h28 M10 24 h28 M10 32 h28" stroke="currentColor" strokeWidth="3" />
          <circle cx="18" cy="16" r="3" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="30" cy="24" r="3" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="20" cy="32" r="3" fill="none" stroke="currentColor" strokeWidth="3" />
        </>
      ) : null}
    </svg>
  );
}
