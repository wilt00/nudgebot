import * as Discord from "discord.js";
import * as Dotenv from "dotenv";
import { reminderCommand } from "./handlers";
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

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", (msg: Discord.Message) => {
  if (msg.content === "ping") {
    msg.reply(`shapow!`);
  }
  if (msg.content.startsWith("~r")) {
    reminderCommand(msg);
  }
});

client.login(env.DISCORD_TOKEN);
