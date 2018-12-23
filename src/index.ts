import * as DB from "better-sqlite3";
import * as Discord from "discord.js";
import * as Dotenv from "dotenv";
// import Message = require("./message.js");
// import { inspect } from "util";
import { env } from "process";
import { listCommand, reminderCommand } from "./handlers";
import { restore } from "./reminder";

// Load .env config. Expects: DISCORD_TOKEN
const configResult = Dotenv.config();
if (configResult.error) {
  console.error("Could not load .env! Terminating...");
  console.error(configResult.error);
  process.exit(-1);
}

export const disClient = new Discord.Client();

// const exitFn = () => {
//   db.close();
// }
// process.on('exit', exitFn);
// process.on('SIGINT', exitFn);
// process.on('SIGHUP', exitFn);
// process.on('SIGTERM', exitFn);

disClient.on("ready", () => {
  console.log(`Logged in as ${disClient.user.tag}!`);
});

disClient.on("error", (e) => {
  console.error("Error event fired");
  console.error(e);
});

disClient.on("message", (msg: Discord.Message) => {
  if (msg.content === "ping") {
    msg.reply(`shapow!`);
  }
  if (msg.content.startsWith("~r")) {
    if (msg.content.toLowerCase() === "~r list") listCommand(msg);
    else reminderCommand(msg);
  }
  // Match variations on "Thank you, bot!"
  // Tests at https://regex101.com/r/MnSns5/1
  if (/thank(s| you).*(reminder|nudge)?bot([^\w]|$)/gim.test(msg.content)) {
    msg.reply("You're very welcome!");
  }
});

disClient.login(env.DISCORD_TOKEN).then(restore);
