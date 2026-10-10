import assert from "node:assert/strict";
import {
  canonicalLevel,
  createPhone,
  getGuidance,
  hasSentFlowers,
  listUserSends,
  nextSnapshots,
  observationFor,
  reducePhone,
  rewindSnapshot,
} from "../src/logic.js";

function apply(phone, action) {
  return reducePhone(phone, action);
}

function walk(actions) {
  return actions.reduce(apply, createPhone());
}

const initialMayaMessages = createPhone().threads.maya;
assert.equal(initialMayaMessages.length, 5);
assert.ok(initialMayaMessages.some((message) => message.from === "me"));
assert.match(initialMayaMessages[initialMayaMessages.length - 1].text, /garden flowers/i);
assert.equal(listUserSends(createPhone()).length, 0);
assert.equal(canonicalLevel(createPhone()), 0);

const happy = walk([
  { type: "open-app", app: "messages" },
  { type: "open-contact", contactId: "maya" },
  { type: "open-picker" },
  { type: "select-photo", photoId: "flowers" },
  { type: "send" },
]);

const directAttach = walk([
  { type: "open-app", app: "messages" },
  { type: "open-contact", contactId: "maya" },
  { type: "open-picker" },
  { type: "select-photo", photoId: "flowers" },
]);
assert.equal(directAttach.screen, "thread");
assert.equal(directAttach.drafts.maya.photoId, "flowers");
assert.equal(getGuidance(directAttach).target, "send");

assert.equal(hasSentFlowers(happy), true);
assert.equal(happy.screen, "thread");
assert.equal(happy.contactId, "maya");
assert.equal(getGuidance(happy).complete, true);
assert.equal(listUserSends(happy).length, 1);
assert.equal(listUserSends(happy)[0].photoLabel, "Garden flowers");
assert.ok(happy.threads.maya.some((message) => message.from === "them" && message.text.includes("lovely")));

const cake = walk([
  { type: "open-app", app: "messages" },
  { type: "open-contact", contactId: "maya" },
  { type: "open-picker" },
  { type: "preview-photo", photoId: "cake" },
  { type: "use-photo" },
  { type: "send" },
]);
assert.equal(hasSentFlowers(cake), false);
assert.equal(cake.drafts.maya.photoId, null);
assert.match(observationFor("game", walk([
  { type: "open-app", app: "messages" },
  { type: "open-contact", contactId: "maya" },
  { type: "open-picker" },
  { type: "preview-photo", photoId: "cake" },
  { type: "use-photo" },
]), { type: "send" }, cake), /Birthday cake/);

const toSam = walk([
  { type: "open-app", app: "messages" },
  { type: "open-contact", contactId: "sam" },
  { type: "open-picker" },
  { type: "preview-photo", photoId: "flowers" },
  { type: "use-photo" },
  { type: "send" },
]);
assert.equal(hasSentFlowers(toSam), false);
assert.ok(toSam.threads.sam.some((message) => message.photoId === "flowers"));

const recovered = walk([
  { type: "open-app", app: "messages" },
  { type: "open-contact", contactId: "sam" },
  { type: "open-picker" },
  { type: "preview-photo", photoId: "flowers" },
  { type: "use-photo" },
  { type: "send" },
  { type: "back" },
  { type: "open-contact", contactId: "maya" },
  { type: "open-picker" },
  { type: "preview-photo", photoId: "flowers" },
  { type: "use-photo" },
  { type: "send" },
]);
assert.equal(hasSentFlowers(recovered), true);
assert.equal(listUserSends(recovered).length, 2);

let phone = createPhone();
assert.equal(getGuidance(phone).target, "app-messages");
assert.equal(canonicalLevel(phone), 0);

phone = apply(phone, { type: "open-app", app: "photos" });
assert.equal(getGuidance(phone).target, "back");
assert.equal(
  observationFor("tutorial", createPhone(), { type: "open-app", app: "photos" }, phone),
  "You opened Photos. You can look around. The photo task continues in Messages.",
);
assert.equal(observationFor("game", createPhone(), { type: "open-app", app: "photos" }, phone), null);

phone = apply(phone, { type: "back" });
assert.equal(phone.screen, "home");

phone = apply(phone, { type: "open-app", app: "messages" });
assert.equal(getGuidance(phone).target, "contact-maya");
assert.equal(
  observationFor("tutorial", createPhone(), { type: "open-app", app: "messages" }, phone),
  null,
);

const onList = phone;
phone = apply(phone, { type: "open-contact", contactId: "luis" });
assert.match(getGuidance(phone).body, /Maya/);
assert.match(
  observationFor("practice", onList, { type: "open-contact", contactId: "luis" }, phone),
  /Luis Alvarez/,
);

phone = apply(phone, { type: "back" });
phone = apply(phone, { type: "open-contact", contactId: "maya" });
assert.equal(getGuidance(phone).target, "attach");
const emptySend = apply(phone, { type: "send" });
assert.match(emptySend.banner, /nothing to send/i);
assert.equal(hasSentFlowers(emptySend), false);

phone = apply(phone, { type: "set-text", text: "Hello Maya" });
phone = apply(phone, { type: "send" });
assert.equal(hasSentFlowers(phone), false);
assert.ok(phone.threads.maya.some((message) => message.text === "Hello Maya"));

phone = apply(phone, { type: "open-picker" });
assert.equal(getGuidance(phone).target, "photo-flowers");
const cakePreview = apply(phone, { type: "preview-photo", photoId: "cake" });
assert.equal(getGuidance(cakePreview).target, "choose-another");
phone = apply(cakePreview, { type: "back" });
phone = apply(phone, { type: "preview-photo", photoId: "flowers" });
assert.equal(getGuidance(phone).target, "use-photo");
phone = apply(phone, { type: "use-photo" });
assert.equal(phone.screen, "thread");
assert.equal(phone.drafts.maya.photoId, "flowers");
assert.equal(getGuidance(phone).target, "send");

let snaps = [createPhone()];
snaps = nextSnapshots(snaps, createPhone());
const home = createPhone();
const messages = apply(home, { type: "open-app", app: "messages" });
snaps = nextSnapshots(snaps, messages);
const thread = apply(messages, { type: "open-contact", contactId: "maya" });
snaps = nextSnapshots(snaps, thread);
assert.equal(snaps.length, 3);
const photos = apply(thread, { type: "home" });
const wandered = apply(photos, { type: "open-app", app: "camera" });
assert.equal(canonicalLevel(wandered), null);
assert.equal(nextSnapshots(snaps, wandered).length, 3);
const rewound = rewindSnapshot(snaps);
assert.equal(rewound.phone.screen, "messages");

const backHome = apply(createPhone(), { type: "back" });
assert.match(backHome.banner, /home screen/);

const about = walk([
  { type: "open-app", app: "settings" },
  { type: "open-app", app: "about" },
]);
assert.equal(about.screen, "about");
assert.equal(apply(about, { type: "back" }).screen, "settings");

const day = walk([
  { type: "open-app", app: "calendar" },
  { type: "open-day", day: 13 },
]);
assert.equal(day.screen, "day");
assert.equal(day.day, 13);

const reminder = walk([
  { type: "open-app", app: "calendar" },
  { type: "open-day", day: 13 },
  { type: "open-reminder" },
  { type: "select-reminder", value: "1 day before" },
  { type: "save-reminder" },
]);
assert.equal(reminder.screen, "day");
assert.equal(reminder.day, 13);
assert.equal(reminder.reminders[13], "1 day before");

const calling = walk([
  { type: "open-app", app: "phone" },
  { type: "call", contactId: "rosa" },
]);
assert.equal(calling.screen, "calling");
assert.equal(apply(calling, { type: "end-call" }).screen, "phone");

const shot = walk([{ type: "open-app", app: "camera" }, { type: "shutter" }]);
assert.equal(shot.screen, "camera-result");
assert.equal(apply(shot, { type: "retake" }).screen, "camera");

const drafted = walk([
  { type: "open-app", app: "messages" },
  { type: "open-contact", contactId: "maya" },
  { type: "open-picker" },
  { type: "preview-photo", photoId: "flowers" },
  { type: "use-photo" },
]);
const leftHome = apply(drafted, { type: "home" });
assert.equal(canonicalLevel(leftHome), null);
assert.equal(leftHome.drafts.maya.photoId, "flowers");

console.log("TechTown lesson checks passed.");
