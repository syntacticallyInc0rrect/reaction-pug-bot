import {
    admins,
    blueTeamEmojiId,
    BotAction,
    BotActionOptions,
    defaultEmbedColor,
    defaultEmbedThumbnailUrl,
    finalEmbedColor,
    finalEmbedThumbnailUrl,
    redTeamEmojiId,
    resetPugEmojiName
} from "./Api";
import {Message, MessageEmbed, MessageReaction, PartialUser, StringResolvable, User} from "discord.js";
import {blueTeamPlayers, redTeamPlayers, wipeTeams} from "./Teams";
import {textChannel} from "./Bot";
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
        color: finalEmbedColor ? finalEmbedColor : defaultEmbedColor,
        title: `Map: ${mapToBePlayed}`,
        thumbnail: finalEmbedThumbnailUrl ? finalEmbedThumbnailUrl : defaultEmbedThumbnailUrl,
        redTeamField: {
            name: redTeamEmojiId,
            value: redTeamPlayers.length > 0 ? redTeamPlayers : "Something is wrong. Contact an Admin.",
            inline: true
        },
        blueTeamField: {
            name: blueTeamEmojiId,
            value: blueTeamPlayers.length > 0 ? blueTeamPlayers : "Something is wrong. Contact an Admin.",
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
                m.react(resetPugEmojiName);
            })
        });

    };

    const handleReactionAdd = (reaction?: MessageReaction, user?: User | PartialUser) => {
        if (!reaction || !user) throw Error("Tried to add a Reaction to the Finalize Embed without a Reaction or a User.")
        const playerIsInThisPug: boolean = !!redTeamPlayers.find(u => u === user) ||
            !!blueTeamPlayers.find(u => u === user);
        const isAdmin = !!admins && !!admins.find(u => user.presence && u.valueOf() === user.presence.userID);

        if (playerIsInThisPug || isAdmin) {
            if (reaction.emoji.name === resetPugEmojiName) {
                reaction.message.delete().then(() => {
                    wipeTeams();
                    resetMapToBePlayed();
                    Queue(BotActionOptions.initialize);
                    Hourglass();
                })
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