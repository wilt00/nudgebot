import * as Discord from "discord.js";
import * as Dotenv from "dotenv";
import { env } from "process";
import { listCommand, reminderCommand } from "./handlers";
import { closeDB, restore } from "./reminder";

// Load .env config. Expects: DISCORD_TOKEN
const configResult = Dotenv.config();
if (configResult.error) {
  console.error("Could not load .env! Terminating...");
  console.error(configResult.error);
  process.exit(-1);
}

export const disClient = new Discord.Client();

const onTime = new Date();

const exitFn = () => {
  closeDB();
}
process.on('exit', exitFn);
process.on('SIGINT', exitFn);
process.on('SIGHUP', exitFn);
process.on('SIGTERM', exitFn);

disClient.on("ready", () => {
  console.log(`Logged in as ${disClient.user.tag}!`);
  if (env.NUDGEBOT_DEBUG_CHANNEL) {
    (disClient.channels.get(
      env.NUDGEBOT_DEBUG_CHANNEL
    ) as Discord.TextChannel).send("Bot has been restarted!");
  }
});

disClient.on("error", e => {
  console.error("Error event fired");
  console.error(e);
});

disClient.on("message", (msg: Discord.Message) => {
  if (env.NUDGEBOT_DEBUG) console.log(`Received message:${msg.content}`);
  if (msg.content === "ping") {
    msg.reply(`shapow!`);
  }
  if (msg.content.startsWith("~r")) {
    const cmd = msg.content.toLowerCase();
    if (cmd === "~r list") listCommand(msg);
    else if (env.NUDGEBOT_DEBUG) {
      // Debug commands
      if (cmd === "~r restart") {
        msg.reply("restarting the bot now!").then(() => {
          // db.close();
          process.exit(0);
        });
      }
      if (cmd === "~r uptime") {
        const pup = process.uptime();
        const phrs = Math.floor(pup / 3600);
        const pmins = Math.floor((pup % 3600) / 60);
        msg.reply(`Bot active for ${phrs} hours, ${pmins} minutes`);
      }
    } else reminderCommand(msg);
  }
  // Match variations on "Thank you, bot!"
  // Tests at https://regex101.com/r/MnSns5/1
  if (/thank(s| you).*(reminder|nudge)?bot([^\w]|$)/gim.test(msg.content)) {
    msg.reply("you're very welcome!");
  }
});

disClient.login(env.DISCORD_TOKEN).then(restore);
