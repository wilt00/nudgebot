import * as DB from "better-sqlite3";
import * as Discord from "discord.js";
import { IntLike } from "integer";
import { disClient } from "./index";

type SendableChannel =
  | Discord.TextChannel
  | Discord.DMChannel
  | Discord.GroupDMChannel;

interface IReminderRow {
  r_id?: IntLike;
  r_time: string;
  r_user: string;
  r_channel: string;
  r_message: string;
}

const dbfile = "./remind.db";
const db = new DB(dbfile, { fileMustExist: true, memory: false });
db.pragma("journal_mode = WAL");

const insertStatement = db.prepare(
  "INSERT INTO reminders (r_time, r_user, r_channel, r_message) VALUES (@r_time, @r_user, @r_channel, @r_message)"
);
const getPast = db.prepare("SELECT * FROM reminders WHERE r_time <= ?");
const deletePast = db.prepare("DELETE FROM reminders WHERE r_time <= ?");
const getCurrent = db.prepare("SELECT * FROM reminders WHERE r_time > ?");
const deleteById = db.prepare("DELETE FROM reminders WHERE r_id = ?");

const testSelectAll = db.prepare("SELECT * FROM reminders");

export function closeDB() {
  db.close();
}

export function listDBReminders() {
  return testSelectAll.all();
}

export function restore() {
  const now = new Date().toISOString();

  console.log("Past:");
  const pastMsgs = getPast.all(now).map(async (row: IReminderRow) => {
    console.log(row);
    const user = await disClient.fetchUser(row.r_user);
    const channel = disClient.channels.get(row.r_channel);
    const outMsg = [
      `${user}, while the bot was inactive, you had a reminder:`,
      `${new Date(row.r_time).toLocaleString("en-US")}`,
    ];
    if (row.r_message) outMsg.push(`About: ${row.r_message}`);
    (channel as SendableChannel).send(outMsg);
  }).length;
  const delInfo = deletePast.run(now);
  if (delInfo.changes !== pastMsgs) {
    console.error(
      `Error! ${pastMsgs} past items found, but ${
        delInfo.changes
      } items deleted`
    );
  }

  console.log("Current:");
  getCurrent.all(now).map(async (row: IReminderRow) => {
    console.log(row);
    const user = await disClient.fetchUser(row.r_user);
    const channel = disClient.channels.get(row.r_channel);
    return new Reminder(
      new Date(row.r_time),
      user,
      channel as SendableChannel,
      row.r_message,
      row.r_id
    );
  });
}

export class Reminder {
  public static list(usr: Discord.User) {
    return Reminder.reminders.filter(r => r.user.equals(usr));
  }

  private static readonly reminders: Reminder[] = [];

  public readonly at: Date;
  public readonly about: string;
  public readonly channel: SendableChannel;
  public readonly user: Discord.User;

  private readonly id: IntLike;

  constructor(
    time: Date,
    usr: Discord.User,
    chn: SendableChannel,
    about: string,
    id?: IntLike
  ) {
    this.at = time;
    this.about = about;
    this.channel = chn;
    this.user = usr;

    if (id) {
      this.id = id;
    } else {
      const dbinfo = insertStatement.run({
        r_channel: this.channel.id,
        r_message: this.about,
        r_time: this.at.toISOString(),
        r_user: this.user.id,
      } as IReminderRow);
      if (dbinfo.changes !== 1) {
        console.error(
          `Error: expected 1 database update, but found ${dbinfo.changes}`
        );
      }
      this.id = dbinfo.lastInsertRowid;
    }

    const msToGo = this.at.valueOf() - new Date().valueOf();
    if (msToGo > 0) {
      setTimeout(this.fire.bind(this), msToGo);
      Reminder.reminders.push(this);
    }
  }

  public equals(r: Reminder) {
    return this.id === r.id;
  }

  public fire() {
    const msgOut = [`This is your reminder, ${this.user}!`];
    if (this.about) msgOut.push(`I'm reminding you about: ${this.about}`);
    this.channel.send(msgOut);

    this.delete();
  }

  public delete() {
    const i = Reminder.reminders.findIndex(r => r.equals(this), this);
    Reminder.reminders.splice(i, 1);
    const result = deleteById.run(this.id);
    if (result.changes !== 1) {
      console.error("Error: Expected to delete 1 row, ${result.changes} changes");
    }
  }

  public notify() {
    const outMsg = [
      `Ok, ${this.user}, reminder scheduled for ${this.pendingString()}`,
    ];
    if (this.about) outMsg.push(`About: ${this.about}`);
    this.channel.send(outMsg);
  }

  public toString(): string {
    return `${this.pendingString()}${this.about ? ` - ${this.about}` : ""}`;
  }

  private pendingString(): string {
    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0
    );
    const dayAfterTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2,
      0,
      0,
      0
    );

    let dateStr;
    if (this.at < now) {
      dateStr = "the past...? ";
    } else if (this.at < tomorrow) {
      dateStr = "";
    } else if (this.at < dayAfterTomorrow) {
      dateStr = "tomorrow at ";
    } else {
      dateStr = `${this.at.toLocaleDateString("en-US")} at `;
    }

    let diff = Math.floor((this.at.valueOf() - now.valueOf()) / 1000);
    const diffSecs = diff % 60;
    diff = Math.floor(diff / 60);
    const diffMins = diff % 60;
    const diffHrs = Math.floor(diff / 60);

    const hrStr = diffHrs > 0 ? ` **${diffHrs}** hours,` : "";
    const minStr =
      diffMins > 0 || (diffHrs > 0 && diffSecs > 0)
        ? ` **${diffMins}** minutes`
        : "";
    const secStr = diffSecs > 0 ? ` **${diffSecs}** seconds` : "";

    return `${dateStr}**${this.at.toLocaleTimeString()}** (in ${hrStr}${minStr}${secStr})`;
  }
}
