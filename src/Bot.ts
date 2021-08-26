import {Client, MessageReaction, PartialUser, User} from "discord.js";
import {Alerts} from "./Alerts";
import {BotActionOptions, botName, botToken, timeToRespond} from "./Api";
import {Hourglass} from "./Hourglass";
import {Queue, queuedPlayers} from "./Queue";
import {Teams} from "./Teams";

export const client: Client = new Client();

client.login(botToken).then(() => {
    setInterval(() => !!queuedPlayers && Alerts(), timeToRespond);
    console.log(`BOT_TOKEN Authenticated at ${new Date()}`);
});

client.on('ready', () => {
    Queue(BotActionOptions.initialize);
    Hourglass();
});

client.on('messageReactionAdd', (
    reaction: MessageReaction,
    user: User | PartialUser
) => {
    const isUserTheBot = user.username == botName;
    const isMessageFromBot = reaction.message.id === /*TODO START*/ "logic goes here" /*TODO END*/
    if (!isUserTheBot && isMessageFromBot) {
        switch (reaction.message.id) {
            case "A":
                Queue(BotActionOptions.reactionAdd, reaction, user);
                break;
            case "B":
                Teams(BotActionOptions.reactionAdd, reaction, user);
                break;
            case "C":
                //TODO: Maps(BotActionOptions.reactionAdd, reaction, user);
                break;
            case "D":
                //TODO: Finalize(BotActionOptions.reactionAdd, reaction, user);
                break;
            default:
                break;
        }
    }
});

client.on('messageReactionRemove', (
    reaction: MessageReaction,
    user: User | PartialUser
) => {
    switch (reaction.message.id) {
        case "A":
            Queue(BotActionOptions.reactionRemove, reaction, user);
            break;
        case "B":
            //TODO: Teams(BotActionOptions.reactionRemove, reaction, user);
            break;
        case "C":
            //TODO: Maps(BotActionOptions.reactionRemove, reaction, user);
            break;
        default:
            break;
    }
});