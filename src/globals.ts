import * as Discord from "discord.js";

export const disClient = new Discord.Client();

export const Maxint = (2 ** 31) - 1;
export const MaxSecs = Math.floor(Maxint / 1000);