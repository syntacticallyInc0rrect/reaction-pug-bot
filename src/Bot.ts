import {Channel, Client, Guild, MessageReaction, PartialUser, TextChannel, User} from "discord.js";
import {Alerts} from "./Alerts";
import {
    BotActionOptions,
    botToken,
    finishPugEmojiName,
    ActivePug,
    timeToRespond,
    spliceMapPool,
    pushMapPool
} from "./Api";
import {Hourglass} from "./Hourglass";
import {Queue, queuedPlayers, queueMsgId, removeReaction} from "./Queue";
import {Teams, tmMsgId} from "./Teams";
import {Finalize} from "./Finalize";
import {MapVote, mapVoteMsgId} from "./MapVote";

export const client: Client = new Client();
export let guild: Guild;
export let channelId: string;
export let discordId: string;
export let pugCount: bigint = BigInt(0);
export let queueVoiceChannelId: string;
export let activePugs: ActivePug[] = [];
export let mapToBePlayed: string = "";
export let lastThreeMapsPlayed: string[] = [];

export const setMapToBePlayed = (newMapToBePlayed: string) => {
    mapToBePlayed = newMapToBePlayed;
};

export const resetMapToBePlayed = () => {
    mapToBePlayed = "";
};

export const updateLastThreeMapsPlayed = () => {
  lastThreeMapsPlayed.push(mapToBePlayed);
  spliceMapPool(mapToBePlayed);
  if (lastThreeMapsPlayed.length > 3) {
      pushMapPool(lastThreeMapsPlayed[0]);
      lastThreeMapsPlayed.splice(0, 1);
  }
};

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
            case mapVoteMsgId:
                MapVote(BotActionOptions.reactionAdd, reaction, user);
                break;
            default:
                if (reaction.emoji.name === finishPugEmojiName) {
                    if (!!activePugs.find(p => p.messageId === reaction.message.id)) {
                        Finalize(BotActionOptions.reactionAdd, reaction.message.id, mapToBePlayed, reaction, user);
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
            Queue(BotActionOptions.reactionRemove, reaction, user);
            break;
        case tmMsgId:
            Teams(BotActionOptions.reactionRemove, reaction, user);
            break;
        case mapVoteMsgId:
            MapVote(BotActionOptions.reactionRemove, reaction, user);
            break;
        default:
            break;
    }
});