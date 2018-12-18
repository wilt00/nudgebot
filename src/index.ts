import * as Discord from "discord.js";
import { inspect } from "util";
import { env } from "process";

let count = 0;

const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg: Discord.Message) => {
  console.log(`Message: ${inspect(msg)}`);
  if (msg.content === "ping") {
    msg.reply(`shapow! ${count}`);
  }
});

client.login(env.DISCORD_TOKEN);
