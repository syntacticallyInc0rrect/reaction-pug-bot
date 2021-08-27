import {Channel, Client, MessageReaction, PartialUser, TextChannel, User} from "discord.js";
import {Alerts} from "./Alerts";
import {BotActionOptions, botName, botToken, channelId, timeToRespond} from "./Api";
import {Hourglass} from "./Hourglass";
import {Queue, queuedPlayers, queueMsgId} from "./Queue";
import {Teams, tmMsgId} from "./Teams";
import {mapMsgId, Maps} from "./Maps";

export const client: Client = new Client();

export const getChannel = (): Channel => {
    const channel = client.channels.cache.get(channelId);
    if (!channel) throw Error("Your Client does not have any Channels. This is a problem.");
    return channel;
}

export const getTextChannel = (channel: Channel): TextChannel => {
    const isChannelATextChannel = channel instanceof TextChannel;
    if (!isChannelATextChannel) throw Error(
        "Your channel is not a Text Channel. Please correct your Channel ID"
    );
    return <TextChannel>channel;
};

export let textChannel: TextChannel;

client.login(botToken).then(() => {
    setInterval(() => !!queuedPlayers && Alerts(), timeToRespond);
    console.log(`BOT_TOKEN Authenticated at ${new Date()}`);
});

client.on('ready', () => {
    textChannel = getTextChannel(getChannel());
    Queue(BotActionOptions.initialize);
    Hourglass();
});

client.on('messageReactionAdd', (
    reaction: MessageReaction,
    user: User | PartialUser
) => {
    const isUserTheBot = user.username == botName;
    const isMessageFromBot = reaction.message.id === queueMsgId;
    if (!isUserTheBot && isMessageFromBot) {
        switch (reaction.message.id) {
            case queueMsgId:
                Queue(BotActionOptions.reactionAdd, reaction, user);
                break;
            case tmMsgId:
                Teams(BotActionOptions.reactionAdd, reaction, user);
                break;
            case mapMsgId:
                Maps(BotActionOptions.reactionAdd, reaction, user);
                break;
            /*TODO:
            case "finalMsgId":
                Finalize(BotActionOptions.reactionAdd, reaction, user);
                break;
            default:
                break; TODO*/
        }
    }
});

client.on('messageReactionRemove', (
    reaction: MessageReaction,
    user: User | PartialUser
) => {
    switch (reaction.message.id) {
        case queueMsgId:
            Queue(BotActionOptions.reactionRemove, reaction, user);
            break;
        case tmMsgId:
            Teams(BotActionOptions.reactionRemove, reaction, user);
            break;
        case mapMsgId:
            Maps(BotActionOptions.reactionRemove, reaction, user);
            break;
        default:
            break;
    }
});