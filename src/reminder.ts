import * as Discord from "discord.js";

export class Reminder {
  readonly at: Date;
  readonly about: string;
  readonly request: Discord.Message;

  private static nextid = 0;
  private readonly id: number;

  constructor(
    time: Date,
    req: Discord.Message,
    about: string | undefined
  ) {
    this.at = time;
    this.about = about;
    this.request = req;

    this.id = Reminder.nextid;
    Reminder.nextid++;

    const msToGo = this.at.valueOf() - new Date().valueOf();
    if (msToGo > 0) setTimeout(this.fire.bind(this), msToGo);
  }

  equals(r: Reminder) {
    return this.id === r.id;
  }

  fire() {
    const msgOut = [`This is your reminder, ${this.request.author}!`];
    if (this.about) msgOut.push(`I'm reminding you about: ${this.about}`);
    this.request.reply(msgOut);
  }

  notify() {
    this.request.reply([
      `Reminder scheduled for ${this.pendingString()}`,
      `About: ${this.about}`
    ]);
  }

  list(): string {
    return `${this.pendingString()} - ${this.about}`;
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
    if (this.at < now) dateStr = "the past...? ";
    else if (this.at < tomorrow) dateStr = "";
    //"today at";
    else if (this.at < dayAfterTomorrow) dateStr = "tomorrow at ";
    else dateStr = `${this.at.toLocaleDateString("en-US")} at `;

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

export class ReminderStore {
  private readonly reminders: Map<Discord.User, Reminder[]> = new Map();

  add(r: Reminder) {
    if (!this.reminders.has(r.request.author)) this.reminders.set(r.request.author, []);
    this.reminders.get(r.request.author).push(r);
  }

  remove(r: Reminder) {
    const usrR = this.reminders.get(r.request.author);
    const i = usrR.findIndex(r.equals);
    usrR.splice(i, 1);
  }

  get(u: Discord.User): Reminder[] {
    return this.reminders.get(u);
  }
}
