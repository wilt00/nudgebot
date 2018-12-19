import * as Discord from "discord.js";
import * as Dotenv from "dotenv";
import Message = require("./message.js");
// import { inspect } from "util";
import { env } from "process";

// Load .env config. Expects: DISCORD_TOKEN
const configResult = Dotenv.config();
if (configResult.error) {
  console.error("Could not load .env! Terminating...");
  console.error(configResult.error);
  process.exit(-1);
}

const client = new Discord.Client();
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

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", (msg: Discord.Message) => {
  if (msg.content === "ping") {
    msg.reply(`shapow!`);
  }
  if (msg.content.startsWith("~r")) {
    let msgInfo: Message.IMessageInfo, msgOffset: number, rTimeStr: string;
    try {
      msgInfo = Message.parse(msg.content);
    } catch (Error) {
      msg.reply([
        "Sorry, I didn't understand that. I understand messages formatted like this:",
        "[prefix] at 1:00 PM",
        "[prefix] at 0800",
        "[prefix] at midnight",
        "[prefix] in 25 minutes",
        "[prefix] in 2 hrs"
      ]);
      return;
    }
    if (typeof msgInfo.time === "number") {
      let timeUnit: string, fudgeFactor: number;
      if (msgInfo.time >= 360) {
        timeUnit = "hour";
        fudgeFactor = 360;
      } else if (msgInfo.time >= 60) {
        timeUnit = "minute";
        fudgeFactor = 60;
      } else {
        timeUnit = "second";
        fudgeFactor = 1;
      }
      const displayTime = Math.floor(msgInfo.time / fudgeFactor);
      if (displayTime !== 1) timeUnit += "s";
      const fudge = msgInfo.time % fudgeFactor === 0 ? "" : "around ";

      rTimeStr = `in ${fudge}${displayTime} ${timeUnit}`;
      msgOffset = msgInfo.time * 1000;
    } else {
      const now = new Date();
      let dayStr: string, dayNum: number;
      if (
        now.getHours() > msgInfo.time[0] ||
        (now.getHours() === msgInfo.time[0] &&
          now.getMinutes() >= msgInfo.time[1])
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
        msgInfo.time[0],
        msgInfo.time[1]
      );
      rTimeStr = `at ${targetDate.getHours()}:${padMin(
        targetDate.getMinutes()
      )} ${dayStr} (${targetDate.toLocaleString()})`;
      msgOffset = targetDate.valueOf() - now.valueOf();
    }
    const msgOut = [`Reminder will be sent ${rTimeStr}`];
    if (msgInfo.message) msgOut.push(`about: ${msgInfo.message}`);
    msg.reply(msgOut);
    setTimeout(remind, msgOffset, msg.author, msgInfo.message);
  }
});

client.login(env.DISCORD_TOKEN);
