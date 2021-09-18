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
    redTeamName
} from "./Api";
import {Message, MessageEmbed, MessageReaction, PartialUser, StringResolvable, User} from "discord.js";
import {
    activePugs,
    guild,
    pugCount,
    queueVoiceChannelId,
    removeActivePug,
    resetMapToBePlayed,
    textChannel,
    updateActivePugMessageId,
    updateLastThreeMapsPlayed
} from "./Bot";
import {EmbedField, Queue, removeReaction} from "./Queue";
import {Hourglass} from "./Hourglass";
import {blueTeam, redTeam, wipeTeams} from "./Captains";
import {Team} from "./Teams";

type FinalEmbedProps = {
    author: StringResolvable,
    color: StringResolvable,
    title: StringResolvable,
    thumbnail: StringResolvable,
    redTeamField: EmbedField,
    blueTeamField: EmbedField,
    footer: StringResolvable
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
        },
        footer: `PUG #${pugCount}`
    };
};

const buildFinalEmbed = (props: FinalEmbedProps): MessageEmbed => {
    return new MessageEmbed()
        .setAuthor(props.author)
        .setColor(props.color)
        .setTitle(props.title)
        .setThumbnail(props.thumbnail)
        .addFields(props.redTeamField, props.blueTeamField)
        .setFooter(props.footer);
};

const getVoiceChannelId = (team: Team, messageId: string): string => {
    return team === redTeam ?
        activePugs.find(p => p.messageId === messageId)!.redTeamChannelId :
        team === blueTeam ?
            activePugs.find(p => p.messageId === messageId)!.blueTeamChannelId :
            "";
};

const movePlayersBackToQueueVoiceChannel = (messageId: string) => {
    const redVoiceChannelId = getVoiceChannelId(redTeam, messageId);
    const blueVoiceChannelId = getVoiceChannelId(blueTeam, messageId);

    !!guild.channels.cache.get(redVoiceChannelId) &&
    guild.channels.cache.get(redVoiceChannelId)!.members.forEach(m => {
        if (!!m.voice.channel) {
            m.voice.setChannel(queueVoiceChannelId).catch(e => console.log(e.message));
        }
    });

    !!guild.channels.cache.get(blueVoiceChannelId) &&
    guild.channels.cache.get(blueVoiceChannelId)!.members.forEach(m => {
        if (!!m.voice.channel) {
            m.voice.setChannel(queueVoiceChannelId).catch(e => console.log(e.message));
        }
    });

    setTimeout(() => {
        deleteOldVoiceChannels(messageId);
        removeActivePug(messageId);
    }, 1500);

};

const deleteOldVoiceChannels = (messageId: string) => {
    const redVoiceChannelId = getVoiceChannelId(redTeam, messageId);
    const blueVoiceChannelId = getVoiceChannelId(blueTeam, messageId);

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
        let message: Message | undefined;

        const getMessage = (): Message => {
            message = textChannel.messages.cache.get(msgId);
            if (!message) throw Error("The Bot Message was not found. This is a problem.");
            return message;
        }

        getMessage().delete().then(() => {
            textChannel.send(buildFinalEmbed(getFinalEmbedProps(mapToBePlayed))).then(m => {
                message = m;
                updateActivePugMessageId(m.id);
                wipeTeams();
                // updateLastThreeMapsPlayed();
                resetMapToBePlayed();
                Queue(BotActionOptions.initialize);
                Hourglass();
                setTimeout(() => message && message.react(finishPugEmojiName), (30 * 1000));
            });

        });
    };

    const handleReactionAdd = (reaction?: MessageReaction, user?: User | PartialUser) => {
        if (!reaction || !user) throw Error("Tried to add a Reaction to the Finalize Embed without a Reaction or a User.")
        const redTeamPlayers = activePugs[
            activePugs.findIndex(p => p.messageId === reaction.message.id)
            ].redTeamPlayers;
        const blueTeamPlayers = activePugs[
            activePugs.findIndex(p => p.messageId === reaction.message.id)
            ].blueTeamPlayers;
        const playerIsInThisPug: boolean = !!redTeamPlayers.find(u => u === user) ||
            !!blueTeamPlayers.find(u => u === user);
        const isAdmin = !!admins && !!admins.find(u => user.presence && u.valueOf() === user.presence.userID);

        if (playerIsInThisPug || isAdmin) {
            if (reaction.emoji.name === finishPugEmojiName) {
                movePlayersBackToQueueVoiceChannel(reaction.message.id);
                reaction.message.delete().then();
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