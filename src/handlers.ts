import * as Discord from "discord.js";
import Message = require("./message.js");
import { Reminder, ReminderStore } from "./reminder";

const reminders = new ReminderStore();

function padMin(mins: number): string {
  if (mins < 10) {
    return `0${mins}`;
  }
  return mins.toString();
}

// TODO:
// function sanitizeMessage(message:string, mbr: Discord.GuildMember): string {}

export function reminderCommand(msg: Discord.Message) {
  const now = new Date();

  let msgInfo: Message.IMessageInfo;
  try {
    msgInfo = Message.parse(msg.content.slice(2));
  } catch (Error) {
    msg.reply([
      "Sorry, I didn't understand that. I understand messages formatted like this:",
      "[prefix] at 1:00 PM",
      "[prefix] at 0800",
      "[prefix] at midnight",
      "[prefix] in 25 minutes",
      "[prefix] in 2 hours and 30 minutes",
      "[prefix] 2 hrs 30 mins  (Sets one alarm in 2 hrs 30 mins)",
      "[prefix] 2 hrs and in 30 mins  (Sets two alarms, one in 2 hrs and another in 30 mins)"
    ]);
    return;
  }

  // Combine relative tokens into one
  const relTokens: Message.IRelTime[][] = [[]];
  let r = 0;
  msgInfo.list.forEach((t, i, ls) => {
    // Just relative tokens - but don't .filter(), we need the info
    if (t.type !== "REL") return;
    // Separate relative time tokens into buckets representing logical units
    // Conditions where we want to move to a new bucket:
    //  - t.newRel === true (Corresponds to "...and in ..." in the text)
    //  - previous token was ABS (e.g. "...5:00pm 2 hrs")
    //  - current bucket already contains this unit
    if (
      t.newRel ||
      (i > 0 && ls[i - 1].type !== "REL") ||
      relTokens[r].some(rt => rt.unit === t.unit)
    ) {
      r++;
      relTokens[r] = [];
    }
    relTokens[r].push(t);
  });

  for (const relChunk of relTokens) {
    if (relChunk.length < 1) continue;

    const secs = relChunk.reduce((acc, cur) => acc + cur.seconds, 0);
    const targetDate = new Date(now.valueOf() + 1000 * secs);

    const r = new Reminder(targetDate, msg, msgInfo.message);
    reminders.add(r);
    r.notify();
  }

  const absTokens = msgInfo.list.filter(t => t.type === "ABS");
  if (absTokens.length > 0) {
    for (let t of absTokens as Message.IAbsTime[]) {
      let dayStr: string, dayNum: number;
      if (t.minutes < 0) t.minutes = 0;
      if (
        now.getHours() > t.hours ||
        (now.getHours() === t.hours && now.getMinutes() >= t.minutes)
      ) {
        // Tomorrow
        dayStr = "tomorrow";
        dayNum = now.getDate() + 1;
      } else {
        // Today
        dayStr = "today";
        dayNum = now.getDate();
      }
      const targetDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        dayNum,
        t.hours,
        t.minutes
      );
      const r = new Reminder(targetDate, msg, msgInfo.message);
      reminders.add(r);
      r.notify();
    }
  }
}

export function listCommand(msg: Discord.Message) {
  const rList = reminders.get(msg.author);
  if (!rList || rList.length === 0) {
    msg.reply("you have no currently active reminders!");
  } else {
    const reminderStrings = rList.map((r) => r.list());
    msg.reply(["here are your active reminders!"].concat(reminderStrings));
  }
}