import {Channel, Client, Guild, MessageReaction, PartialUser, TextChannel, User} from "discord.js";
import {Alerts} from "./Alerts";
import {
    ActivePug,
    BotActionOption,
    botToken,
    finishPugEmojiName,
    mapPickOption,
    MapPickOption,
    timeToRespond
} from "./Api";
import {Queue, queuedPlayers, queueMsgId, removeReaction} from "./Queue";
import {Teams, tmMsgId} from "./Teams";
import {MapBan, mapMsgId, mapToBePlayed} from "./MapBan";
import {Finalize} from "./Finalize";
import {Hourglass} from "./Hourglass";
import {RandomMap} from "./RandomMap";

export const client: Client = new Client();
export let guild: Guild;
export let channelId: string;
export let discordId: string;
export let pugCount: bigint = BigInt(0);
export let queueVoiceChannelId: string;
export let activePugs: ActivePug[] = [];

export const addActivePug = (props: ActivePug) => {
    activePugs.push(props);
};

export const removeActivePug = (messageId: string) => {
    activePugs.splice(activePugs.findIndex(p => p.messageId === messageId), 1);
};

export const updateActivePugMessageId = (messageId: string) => {
    activePugs[activePugs.findIndex(p => p.id === pugCount)].messageId = messageId;
};

export const increasePugCount = () => {
    pugCount++
};

const getGuild = (): Guild => {
    const maybeGuild: Guild | undefined = client.guilds.cache.first();
    if (!!maybeGuild) {
        discordId = maybeGuild.id;
        return maybeGuild;
    }
    throw new Error("Your bot must be invited into a Discord Guild before trying to run it.");
};

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

const initiateMapPicks = (mapPickOption: MapPickOption) => {
    switch (mapPickOption) {
        case MapPickOption.ban:
            Hourglass();
            break;
        case MapPickOption.random:
            RandomMap();
            break;
        case MapPickOption.vote:
            RandomMap();
            break;
        default:
            break;
    }
}

const initializeBot = () => {
    guild = getGuild();
    guild.channels.create("PUG", {
        type: "category"
    }).then(c => {
        const everyoneRole = guild.roles.cache.find(r => r.name === '@everyone');
        guild.channels.create("PUG BOT", {
            parent: c,
            type: "text",
            permissionOverwrites: [
                {
                    id: everyoneRole!.id,
                    deny: ['SEND_MESSAGES'],
                    allow: ['VIEW_CHANNEL', 'ADD_REACTIONS']
                },
            ],
        }).then(c => {
            channelId = c.id
        });
        guild.channels.create("PUG CHAT", {
            parent: c,
            type: "text"
        }).then();
        guild.channels.create("PUG Queue", {
            parent: c,
            type: "voice"
        }).then(c => {
                queueVoiceChannelId = c.id;
                textChannel = getTextChannel(getChannel());
                Queue(BotActionOption.initialize);
                initiateMapPicks(mapPickOption);
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
                Queue(BotActionOption.reactionAdd, reaction, user);
                break;
            case tmMsgId:
                Teams(BotActionOption.reactionAdd, reaction, user);
                break;
            case mapMsgId:
                MapBan(BotActionOption.reactionAdd, reaction, user);
                break;
            default:
                if (reaction.emoji.name === finishPugEmojiName) {
                    if (!!activePugs.find(p => p.messageId === reaction.message.id)) {
                        Finalize(BotActionOption.reactionAdd, reaction.message.id, mapToBePlayed, reaction, user);
                    }
                } else {
                    removeReaction(reaction, user);
                }
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
            Queue(BotActionOption.reactionRemove, reaction, user);
            break;
        case tmMsgId:
            Teams(BotActionOption.reactionRemove, reaction, user);
            break;
        case mapMsgId:
            MapBan(BotActionOption.reactionRemove, reaction, user);
            break;
        default:
            break;
    }
});