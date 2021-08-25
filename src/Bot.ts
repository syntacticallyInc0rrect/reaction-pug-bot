import {Client, MessageReaction, PartialUser, User} from "discord.js";
import * as Api from "./Api";
import {Hourglass} from "./Hourglass";

export const client = new Client;

client.login(Api.botToken).then(() => {
    console.log(`BOT_TOKEN Authenticated at ${Date.now()}`);
});

client.on('ready', () => {
    Hourglass();
});

client.on('messageReactionAdd', (
    reaction: MessageReaction,
    user: User | PartialUser
) => {
    console.log(reaction);
    console.log(user);
});

client.on('messageReactionRemove', (
    reaction: MessageReaction,
    user: User | PartialUser
) => {
    console.log(reaction);
    console.log(user);
});