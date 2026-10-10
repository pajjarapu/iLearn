import { createPhone } from "./logic.js";

export const EXTRA_LESSONS = {
  cafe: {
    title: "Make a phone call",
    description: "Open Phone, choose Rosa from your contacts, start a practice call, and hang up.",
    progressKey: "callTutorial",
    practiceKey: "callPractice",
    goal: "Call Rosa from your contacts, then hang up when you are ready.",
    success: "You chose Rosa, started a practice phone call, and ended it using the red hang-up button.",
    steps: [
      { screen: "home", target: "app-phone", type: "open-app", app: "phone", title: "Open Phone", body: "Tap the green Phone icon in the Dock." },
      { screen: "phone", target: "phone-contacts", type: "open-phone-contacts", title: "Open Contacts", body: "The Phone app opens to recent calls. Tap Contacts in the bottom bar to find Rosa." },
      { screen: "phone-contacts", target: "call-rosa", type: "open-call-contact", contactId: "rosa", title: "Choose Rosa", body: "Find Rosa in your contacts and tap her name. She is your friend from book club." },
      { screen: "call-contact", target: "start-call", type: "call", contactId: "rosa", title: "Start the call", body: "Check that the contact is Rosa Nguyen, then tap the green Call button. This is a simulated call." },
      { screen: "calling", target: "end-call", type: "end-call", title: "End the call", body: "Tap the red hang-up button when you are ready to end the practice call." },
    ],
  },
  safety: {
    title: "Spot suspicious messages",
    description: "Read a fictional delivery message, identify warning signs, and practice reporting it.",
    progressKey: "safetyTutorial",
    practiceKey: "safetyPractice",
    goal: "Find the message from the unfamiliar number, then delete it and report it as junk without opening the link.",
    success: "You spotted the urgent request, unfamiliar link, and request for card details. You reported the message without opening its link or replying.",
    steps: [
      { screen: "home", target: "app-messages", type: "open-app", app: "messages", title: "Open Messages", body: "Tap Messages. An unfamiliar sender has sent a delivery message." },
      { screen: "safety-inbox", target: "open-suspicious", type: "open-suspicious", title: "Read the unfamiliar message", body: "Tap the message from the unfamiliar phone number. Reading it does not open the link inside it." },
      { screen: "safety-message", target: "report-suspicious", type: "report-suspicious", title: "Delete the suspicious message", body: "Tap Delete below the spam notice to open the reporting confirmation. Keep the link unopened and avoid replying or marking this sender as known." },
      { screen: "safety-report", target: "confirm-report", type: "confirm-report", title: "Confirm the report", body: "Tap Delete and Report Junk to finish this practice task. Only the fictional message in this lesson is affected." },
    ],
  },
};

export function createLessonPhone(lesson) {
  return { ...createPhone(), lesson, senderNumber: `+1 (202) 555-01${String(Math.floor(Math.random() * 100)).padStart(2, "0")}` };
}

export function extraGuidance(phone) {
  const lesson = EXTRA_LESSONS[phone.lesson];
  const complete = phone.lesson === "cafe" ? phone.callCompleted : phone.suspiciousReported;
  const index = phone.lesson === "cafe"
    ? phone.screen === "home" ? 0 : phone.screen === "phone" ? 1 : phone.screen === "phone-contacts" ? 2 : phone.screen === "call-contact" ? 3 : 4
    : phone.screen === "home" ? 0 : phone.screen === "safety-inbox" ? 1 : phone.screen === "safety-message" ? 2 : 3;
  const step = lesson.steps[index];
  if (phone.screen !== step.screen && !complete) {
    return { complete: false, target: "home", type: "home", title: "Return to the Home screen", body: `Tap Home to continue ${lesson.title.toLowerCase()}.`, step: null };
  }
  return { ...step, complete, step: index + 1 };
}

export function matchesExtraStep(guidance, action) {
  return action.type === guidance.type && (!guidance.app || action.app === guidance.app) && (!guidance.contactId || action.contactId === guidance.contactId);
}
