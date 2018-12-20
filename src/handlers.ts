import * as Discord from "discord.js";
import Message = require("./message.js");

let hook: Discord.WebhookClient = undefined;

/**
 * Sends message to target user using default app webhook.
 * Initializes webhook client if does not yet exist
 * @param target Target of reminder
 * @param message Message to remind about
 */
function remind(target: Discord.User, message?: string) {
  if (!hook) {
    hook = new Discord.WebhookClient(
      "524715382867492894",
      "k_uLFGNcwD--L9d-DqHFcnfyOoaRSFJGl1FpGg7NI7hzxuCeggeu92xOvzZQZ2CAJEkW"
    );
  }
  const msgOut = [`This is your reminder, ${target}!`];
  if (message) msgOut.push(`I'm reminding you about: ${message}`);
  hook.send(msgOut);
}

function padMin(mins: number): string {
  if (mins < 10) {
    return `0${mins}`;
  }
  return mins.toString();
}

export function reminderCommand(msg: Discord.Message) {
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
    // Conditions where we want to move to a new bucket:
    //  - t.newRel === true
    //  - previous token was ABS
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
    const totalRelTimeout = relChunk.reduce(
      (acc: number, cur) => acc + cur.seconds,
      0
    );
    setTimeout(remind, totalRelTimeout * 1000, msg.author, msgInfo.message);

    const totalRelHrs = Math.floor(totalRelTimeout / 3600);
    const totalRelMins = Math.floor(
      (totalRelTimeout - totalRelHrs * 3600) / 60
    );
    const totalRelSecs = totalRelTimeout % 60;
    const relMsg = [
      `Reminder scheduled in **${totalRelHrs > 0 ? `${totalRelHrs} hours` : ""}${
        totalRelMins > 0 ? `${totalRelMins} minutes` : ""
      }${totalRelSecs > 0 ? `${totalRelSecs} seconds` : ""}**`
    ];
    if (msgInfo.message) relMsg.push(`about: ${msgInfo.message}`);
    msg.reply(relMsg);
  }

  const absTokens = msgInfo.list.filter(t => t.type === "ABS");
  if (absTokens.length > 0) {
    const now = new Date();
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
      const rTimeStr = `at ${targetDate.getHours()}:${padMin(
        targetDate.getMinutes()
      )} ${dayStr} (${targetDate.toLocaleString()})`;
      const msgOffset = targetDate.valueOf() - now.valueOf();
      const msgOut = [`Reminder will be sent ${rTimeStr}`];
      if (msgInfo.message) msgOut.push(`about: ${msgInfo.message}`);
      msg.reply(msgOut);
      setTimeout(remind, msgOffset, msg.author, msgInfo.message);
    }
  }
}
