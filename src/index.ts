// import * as Discord from "discord.js";
import * as Discord from "discord.js";
import { inspect } from "util";
import Datastore = require("@google-cloud/datastore");

const datastore = new Datastore();

const countK = datastore.key(["TEST", "count"]);
interface ICount {
  count: number;
}

const discordK = datastore.key(["token", "discord"]);
interface IToken {
  token: string;
}

async function initializeCount() {
  datastore.save({
    key: countK,
    data: {
      count: 0,
    },
  }).then(() => {
    console.log("Count initialization success");
  }).catch((err) => {
    console.log("Count initialization failed");
    console.log(err);
  });
}

async function incrementCount() {
  let err: Error, entity: object = await datastore.get(countK);
  if (err) {
    console.log("Update failed on retrieval");
    console.log(err);
    return;
  }
  let entityCt = entity as ICount[];
  entityCt[0].count++;
  datastore.save({
    key: countK,
    data: entityCt,
  }).catch((err) => {
    console.log("Update failed on writeback");
    console.log(err);
  });
  return entityCt[0].count;
}

const client = new Discord.Client();

client.on("ready", () => {
  initializeCount();
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg: Discord.Message) => {
  console.log(`Message: ${inspect(msg)}`);
  if (msg.content === "ping") {
    msg.reply("shapow!" + await incrementCount());
  }
});

datastore.get(discordK).then((data) => {
  const dToken = data[0] as IToken;
  client.login(dToken.token);
}).catch((err: Error) => {
  console.log("Failed to retrieve token");
  console.log(err);
});
