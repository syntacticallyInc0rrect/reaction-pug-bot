import {
    admins,
    blueTeamEmojiId,
    blueTeamEmojiName,
    blueTeamName,
    BotAction,
    BotActionOptions,
    defaultEmbedColor,
    defaultEmbedThumbnailUrl,
    finalEmbedThumbnailUrl,
    finishPugEmojiName,
    redTeamEmojiId,
    redTeamEmojiName,
    redTeamName,
    resetPugEmojiName
} from "./Api";
import {Message, MessageEmbed, MessageReaction, PartialUser, StringResolvable, User} from "discord.js";
import {blueTeam, redTeam, Team, wipeTeams} from "./Teams";
import {
    guild,
    pugVoiceChannels,
    queueVoiceChannelId,
    removePugVoiceChannel,
    textChannel,
    updatePugVoiceChannelMessageId
} from "./Bot";
import {EmbedField, Queue, removeReaction} from "./Queue";
import {Hourglass} from "./Hourglass";
import {resetMapToBePlayed} from "./Maps";

export let finalMsgId: string;

type FinalEmbedProps = {
    author: StringResolvable,
    color: StringResolvable,
    title: StringResolvable,
    thumbnail: StringResolvable,
    redTeamField: EmbedField,
    blueTeamField: EmbedField
};

const getFinalEmbedProps = (mapToBePlayed: string): FinalEmbedProps => {
    return {
        author: "Good luck, have fun!",
        color: defaultEmbedColor,
        title: `Map: ${mapToBePlayed}`,
        thumbnail: finalEmbedThumbnailUrl ? finalEmbedThumbnailUrl : defaultEmbedThumbnailUrl,
        redTeamField: {
            name: `${redTeamEmojiId !== "" ? redTeamEmojiId : redTeamEmojiName} ${redTeamName}`,
            value: redTeam.players.length > 0 ? redTeam.players : "Something is wrong. Contact an Admin.",
            inline: true
        },
        blueTeamField: {
            name: `${blueTeamEmojiId !== "" ? blueTeamEmojiId : blueTeamEmojiName} ${blueTeamName}`,
            value: blueTeam.players.length > 0 ? blueTeam.players : "Something is wrong. Contact an Admin.",
            inline: true
        }
    };
};

const buildFinalEmbed = (props: FinalEmbedProps): MessageEmbed => {
    return new MessageEmbed()
        .setAuthor(props.author)
        .setColor(props.color)
        .setTitle(props.title)
        .setThumbnail(props.thumbnail)
        .addFields(props.redTeamField, props.blueTeamField);
};

const getVoiceChannelId = (team: Team): string => {
    return team === redTeam ?
        pugVoiceChannels.find(p => p.messageId === finalMsgId)!.redTeamChannelId :
        team === blueTeam ?
            pugVoiceChannels.find(p => p.messageId === finalMsgId)!.blueTeamChannelId :
            "";
};

const movePlayersBackToQueueVoiceChannel = () => {
    const redVoiceChannelId = getVoiceChannelId(redTeam);
    const blueVoiceChannelId = getVoiceChannelId(blueTeam);

    !!guild.channels.cache.get(redVoiceChannelId) &&
    guild.channels.cache.get(redVoiceChannelId)!.members.forEach(m => {
        !!m.voice.channel &&
        m.voice.setChannel(queueVoiceChannelId);
    });
    !!guild.channels.cache.get(blueVoiceChannelId) &&
    guild.channels.cache.get(blueVoiceChannelId)!.members.forEach(m => {
        !!m.voice.channel &&
        m.voice.setChannel(queueVoiceChannelId);
    });
};

const deleteOldVoiceChannels = () => {
    const redVoiceChannelId = getVoiceChannelId(redTeam);
    const blueVoiceChannelId = getVoiceChannelId(blueTeam);

    !!guild.channels.cache.get(redVoiceChannelId) &&
    !!guild.channels.cache.get(redVoiceChannelId)!.parent &&
    guild.channels.cache.get(redVoiceChannelId)!.parent!.delete().then(
        () => {
            !!guild.channels.cache.get(redVoiceChannelId) &&
            guild.channels.cache.get(redVoiceChannelId)!.delete().then(
                () => {
                    !!guild.channels.cache.get(blueVoiceChannelId) &&
                    guild.channels.cache.get(blueVoiceChannelId)!.delete()
                }
            )
        });
};

export const Finalize = (
    action: BotAction,
    msgId: string,
    mapToBePlayed: string,
    reaction?: MessageReaction,
    user?: User | PartialUser,
) => {
    const initializeFinalize = (msgId: string, mapToBePlayed: string) => {
        const getMessage = (): Message => {
            const message = textChannel.messages.cache.get(msgId);
            if (!message) throw Error("The Bot Message was not found. This is a problem.");
            return message;
        }

        getMessage().delete().then(() => {
            textChannel.send(buildFinalEmbed(getFinalEmbedProps(mapToBePlayed))).then(m => {
                finalMsgId = m.id;
                m.react(finishPugEmojiName).then(() => updatePugVoiceChannelMessageId(m.id));
            })
        });

    };

    const handleReactionAdd = (reaction?: MessageReaction, user?: User | PartialUser) => {
        if (!reaction || !user) throw Error("Tried to add a Reaction to the Finalize Embed without a Reaction or a User.")
        const playerIsInThisPug: boolean = !!redTeam.players.find(u => u === user) ||
            !!blueTeam.players.find(u => u === user);
        const isAdmin = !!admins && !!admins.find(u => user.presence && u.valueOf() === user.presence.userID);

        if (playerIsInThisPug || isAdmin) {
            if (reaction.emoji.name === resetPugEmojiName) {
                reaction.message.delete().then(() => {
                    movePlayersBackToQueueVoiceChannel();
                    deleteOldVoiceChannels();
                    removePugVoiceChannel();
                    wipeTeams();
                    resetMapToBePlayed();
                    Queue(BotActionOptions.initialize);
                });
            } else if (reaction.emoji.name === finishPugEmojiName) {
                reaction.message.delete().then(() => {
                    movePlayersBackToQueueVoiceChannel();
                    deleteOldVoiceChannels();
                    removePugVoiceChannel();
                    wipeTeams();
                    resetMapToBePlayed();
                    Queue(BotActionOptions.initialize);
                    Hourglass();
                });
            } else {
                removeReaction(reaction, user);
            }
        } else {
            removeReaction(reaction, user);
        }

    };

    switch (action) {
        case BotActionOptions.initialize:
            initializeFinalize(msgId, mapToBePlayed)
            break;
        case BotActionOptions.reactionAdd:
            handleReactionAdd(reaction, user);
            break;
        default:
            break;
    }
};