import {MessageEmbed, MessageReaction, PartialUser, StringResolvable, User} from "discord.js";
import {
    BotAction,
    BotActionOptions,
    defaultEmbedColor,
    defaultEmbedThumbnailUrl,
    defaultValueForEmptyTeam,
    mapPool,
    matchSize,
    queueEmbedThumbnailUrl,
    queueEmbedTitle,
    queueEmojiIdNum,
    queueEmojiName,
    resetPugEmojiName
} from "./Api";
import {activePugs, textChannel} from "./Bot";
import {Hourglass} from "./Hourglass";
import {Captains} from "./Captains";

export type QueuedPlayer = {
    user: User | PartialUser,
    timestamp: Date,
    warned: boolean
};

export type EmbedField = {
    name: StringResolvable,
    value: StringResolvable,
    inline: boolean
};

type QueueEmbedProps = {
    color: StringResolvable,
    title: StringResolvable,
    thumbnail: StringResolvable,
    mapPoolField: EmbedField,
    inQueueField: EmbedField
}

const queueReaction: string = queueEmojiIdNum !== "" ? queueEmojiIdNum : queueEmojiName;

export const removeReaction = (reaction: MessageReaction, user: User | PartialUser) => {
    const reactionName: string = reaction.emoji.name;
    const reactionId: string = reaction.emoji.id ? reaction.emoji.id : "";
    const getUnwantedReaction = (): MessageReaction => {
        const foundWithReactionName = reaction.message.reactions.cache.get(reactionName);
        const foundWithReactionId = reaction.message.reactions.cache.get(reactionId);
        if (foundWithReactionName) {
            return foundWithReactionName;
        }
        if (foundWithReactionId) {
            return foundWithReactionId;
        }
        throw Error("The reaction that is attempting to be removed does not exist.");
    }
    getUnwantedReaction().users.remove(user.id).then(
        () => console.log(`${user.username}'s reaction was removed at ${Date.now()}`)
    );
}

const handleReactionAdd = (reaction?: MessageReaction, user?: User | PartialUser): void => {
    if (!user || !reaction) {
        throw Error("Somehow a handle reaction add was called without a reaction or a user.\n" +
            "Something is seriously wrong here.");
    }

    if (reaction.emoji.name === queueEmojiName) {
        const userAlreadyExistsInQueue = !!queuedPlayers && !!queuedPlayers.find(qp => qp.user === user);
        const userAlreadyExistsInActivePug = !!activePugs.find(p => p.redTeamPlayers.find(u => u === user)) ||
            !!activePugs.find(p => p.blueTeamPlayers.find(u => u === user));

        if (!userAlreadyExistsInQueue && !userAlreadyExistsInActivePug) {
            queuedPlayers.push({user: user, timestamp: new Date(), warned: false});
            if (queuedPlayers.length < matchSize) {
                updateQueueEmbed(getQueueEmbedProps(), reaction);
            } else {
                Captains(BotActionOptions.initialize, reaction, user, [...queuedPlayers.map(p => p.user)]);
                queuedPlayers = [];
            }
        } else {
            removeReaction(reaction, user);
        }
    } else if (reaction.emoji.name === resetPugEmojiName) {
        queuedPlayers.splice(0, queuedPlayers.length);
        reaction.message.delete().then(() => {
            Queue(BotActionOptions.initialize);
            Hourglass();
        });

    } else {
        removeReaction(reaction, user);
    }
};

const handleReactionRemove = (reaction?: MessageReaction, user?: User | PartialUser): void => {
    if (!user || !reaction) return;
    if (reaction.emoji.name === queueEmojiName) {
        const userIsQueued = queuedPlayers.length > 0 && queuedPlayers.find(p => p.user === user);
        userIsQueued && queuedPlayers.splice(queuedPlayers.map(p => p.user).indexOf(user), 1);
        updateQueueEmbed(getQueueEmbedProps(), reaction);
    }
};

const buildQueueEmbed = (props: QueueEmbedProps): MessageEmbed => {
    return new MessageEmbed()
        .setColor(props.color)
        .setTitle(props.title)
        .setThumbnail(props.thumbnail)
        .addFields(props.mapPoolField, props.inQueueField);
}

const sendInitialEmbed = (props: QueueEmbedProps) => {
    textChannel.send(buildQueueEmbed(props)).then(m => {
        queueMsgId = m.id;
        m.react(queueReaction).then();
    });
};

const updateQueueEmbed = (props: QueueEmbedProps, reaction?: MessageReaction, removedUser?: User | PartialUser) => {
    if (reaction) {
        reaction.message.edit(buildQueueEmbed(props)).then();
    } else if (removedUser) {
        const queueMsg = textChannel.messages.cache.get(queueMsgId);
        const queueReactions = queueMsg && queueMsg.reactions.cache.get(queueReaction);

        if (queueMsg) {
            queueMsg.edit(buildQueueEmbed(props)).then(
                () => console.log(`${removedUser.username} was removed from the queue at ${Date.now()}`)
            );
        } else {
            throw Error("Queue message was not found.");
        }
        if (queueReactions) {
            queueReactions.users.remove(removedUser.id).then(
                () => console.log(`${removedUser.username}'s reaction was removed from queue`)
            );
        } else {
            throw Error("Queue Reaction Emoji was not found among the Queue message's reactions.");
        }
    }
}

export let queueMsgId: string;
export let queuedPlayers: QueuedPlayer[] = [];
const getPlayerCount = (): string => queuedPlayers ? queuedPlayers.length.toString() : "0";
const getPlayersValue = (): StringResolvable => queuedPlayers && queuedPlayers.length > 0 ?
    queuedPlayers.map(p => p.user) :
    defaultValueForEmptyTeam;

const getQueueEmbedProps = (): QueueEmbedProps => {
    return {
        color: defaultEmbedColor,
        title: queueEmbedTitle,
        thumbnail: queueEmbedThumbnailUrl ? queueEmbedThumbnailUrl : defaultEmbedThumbnailUrl,
        mapPoolField: {name: "Map Pool", value: mapPool, inline: true},
        inQueueField: {name: `In Queue - ${getPlayerCount()}/${matchSize}`, value: getPlayersValue(), inline: false}
    };
};

export const Queue = (
    action: BotAction,
    reaction?: MessageReaction,
    user?: User | PartialUser,
    removedUser?: User | PartialUser
) => {
    switch (action) {
        case BotActionOptions.initialize:
            queuedPlayers = [];
            sendInitialEmbed(getQueueEmbedProps());
            break;
        case BotActionOptions.reactionAdd:
            handleReactionAdd(reaction, user);
            break;
        case BotActionOptions.reactionRemove:
            handleReactionRemove(reaction, user);
            break;
        case BotActionOptions.update:
            updateQueueEmbed(getQueueEmbedProps(), undefined, removedUser);
            break;
        default:
            break;
    }
};