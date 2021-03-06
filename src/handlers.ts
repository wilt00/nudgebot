import * as Discord from "discord.js";
import { Maxint, MaxSecs } from "./globals";
import Message = require("./message.js");
import { listDBReminders, Reminder } from "./reminder";

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
      "[prefix] 2 hrs and in 30 mins  (Sets two alarms, one in 2 hrs and another in 30 mins)",
    ]);
    return;
  }

  // Combine relative tokens into one
  const relTokens: Message.IRelTime[][] = [[]];
  let j = 0;
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
      relTokens[j].some(rt => rt.unit === t.unit)
    ) {
      j++;
      relTokens[j] = [];
    }
    relTokens[j].push(t);
  });

  for (const relChunk of relTokens) {
    if (relChunk.length < 1) continue;

    const secs = relChunk.reduce((acc, cur) => acc + cur.seconds, 0);

    // Test for overflow
    // Currently cannot schedule timer more than Maxint ms in future
    if (secs > MaxSecs) {
      msg.reply("that reminder is too far in the future!");
      continue;
    }

    const targetDate = new Date(now.valueOf() + 1000 * secs);

    const r = new Reminder(
      targetDate,
      msg.author,
      msg.channel,
      msgInfo.message
    );
    r.notify();
  }

  const absTokens = msgInfo.list.filter(t => t.type === "ABS");
  if (absTokens.length > 0) {
    for (const t of absTokens as Message.IAbsTime[]) {
      // TODO: What if it's more than 24 hrs in the future?
      let dayNum: number;
      if (t.minutes < 0) t.minutes = 0;
      if (
        now.getHours() > t.hours ||
        (now.getHours() === t.hours && now.getMinutes() >= t.minutes)
      ) {
        // Tomorrow
        dayNum = now.getDate() + 1;
      } else {
        // Today
        dayNum = now.getDate();
      }
      const targetDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        dayNum,
        t.hours,
        t.minutes
      );
      const r = new Reminder(
        targetDate,
        msg.author,
        msg.channel,
        msgInfo.message
      );
      r.notify();
    }
  }

  console.log(listDBReminders());
}

export function listCommand(msg: Discord.Message) {
  const rList = Reminder.list(msg.author);
  if (!rList || rList.length === 0) {
    msg.reply("you have no currently active reminders!");
  } else {
    const reminderStrings = rList.map(r => r.toString());
    msg.reply(["here are your active reminders!"].concat(reminderStrings));
  }
}

export function listAllCommand(msg: Discord.Message) {
  console.log(
    Reminder.listAll().map(r => `${r.user.tag} (${r.user.id}): ${r.toString()}`)
  );
  msg.reply("Reminders written to log!");
}

export function deleteCommand(msg: Discord.Message, cmd: string) {
  const targetIdStr = cmd.split(" ")[2];
  const targetId = parseInt(targetIdStr, 10);
  if (isNaN(targetId)) {
    msg.reply(`reminder id "${targetIdStr}" is invalid!`);
    return;
  }
  const targetReminder = Reminder.getById(targetId);
  if (!targetReminder) {
    msg.reply(`Could not find reminder with id ${targetId}`);
    return;
  }
  if (!targetReminder.user.equals(msg.author)) {
    msg.reply(`that reminder doesn't belong to you!`);
    return;
  }
  msg.reply(["Deleting reminder:", targetReminder.toString()]);
  targetReminder.delete();
  msg.reply("Deleted!");
}
