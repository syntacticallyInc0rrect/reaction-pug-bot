import {Channel, Client, Guild, MessageReaction, PartialUser, TextChannel, User} from "discord.js";
import {Alerts} from "./Alerts";
import {BotActionOptions, botToken, timeToRespond} from "./Api";
import {Hourglass} from "./Hourglass";
import {Queue, queuedPlayers, queueMsgId} from "./Queue";
import {Teams, tmMsgId} from "./Teams";
import {mapMsgId, Maps, mapToBePlayed} from "./Maps";
import {Finalize, finalMsgId} from "./Finalize";

export const client: Client = new Client();
export let channelId: string;
export let discordId: string;
// export let pugCount: number = 0;
let channelCategoryId: string;
export let queueVoiceChannelId: string;

// export const increasePugCount = (): void => {
//     pugCount++
// };

const getGuild = (): Guild => {
    const maybeGuild: Guild | undefined = client.guilds.cache.first();
    if (!!maybeGuild) {
        discordId = maybeGuild.id;
        return maybeGuild;
    }
    throw new Error("Your bot must be invited into a Discord Guild before trying to run it.");
};

export let guild: Guild;

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

const initializeBot = () => {
    guild = getGuild();
    guild.channels.create("PUG TEST", {
        type: "category"
    }).then(c => {
        channelCategoryId = c.id;
        guild.channels.create("PUG BOT", {
            parent: c,
            type: "text"
        }).then(c => {
            channelId = c.id
        });
        guild.channels.create("PUG CHAT", {
            parent: c,
            type: "text"
        });
        guild.channels.create("PUG Queue", {
            parent: c,
            type: "voice"
        }).then(c => {
                queueVoiceChannelId = c.id;
                textChannel = getTextChannel(getChannel());
                Queue(BotActionOptions.initialize);
                Hourglass();
            }
        );
    });

};

client.login(botToken).then(() => {
    setInterval(() => !!queuedPlayers && Alerts(), timeToRespond);
    console.log(`BOT_TOKEN Authenticated at ${new Date()}`);
});

client.on('ready', () => {
    initializeBot();
});

client.on('messageReactionAdd', (
    reaction: MessageReaction,
    user: User | PartialUser
) => {
    const isUserTheBot = user.bot;
    const isMessageFromBot = reaction.message.author.bot;

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
            case finalMsgId:
                Finalize(BotActionOptions.reactionAdd, finalMsgId, mapToBePlayed, reaction, user);
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