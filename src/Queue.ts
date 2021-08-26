import {Channel, MessageEmbed, MessageReaction, PartialUser, TextChannel, User} from "discord.js";
import {
    BotAction,
    BotActionOptions,
    channelId,
    defaultEmbedColor,
    defaultEmbedThumbnailUrl,
    defaultValueForEmptyTeam,
    mapPool,
    matchSize,
    queueEmbedColor,
    queueEmbedThumbnailUrl,
    queueEmbedTitle,
    queueEmojiId,
    queueEmojiIdNum,
    queueEmojiName
} from "./Api";
import {client} from "./Bot";
import {Teams} from "./Teams";

export type QueuedPlayer = {
    user: User | PartialUser,
    timestamp: Date,
    warned: boolean
};

export type EmbedAddField = {
    name: String,
    value: String,
    inline: boolean
};

type QueueEmbedProps = {
    color: string,
    title: string,
    thumbnail: string,
    mapPoolField: EmbedAddField,
    inQueueField: EmbedAddField
}

export const getTextChannel = (channel: Channel | undefined): TextChannel => {
    const isChannelATextChannel = channel instanceof TextChannel;
    if (!isChannelATextChannel) throw Error(
        "Error: Your channel is not a Text Channel. Please correct your Channel ID"
    );
    return <TextChannel>channel;
};

const removeReaction = (reaction: MessageReaction, user: User | PartialUser) => {
    const reactionName: string = reaction.emoji.name;
    const reactionId: string = reaction.emoji.id ? reaction.emoji.id : "";
    const getUnwantedReaction = (): MessageReaction => {
        const foundWithReactionName = reaction.message.reactions.cache.get(reactionName);
        const foundWithReactionId = reaction.message.reactions.cache.get(reactionId);
        if (foundWithReactionName) { return foundWithReactionName; }
        if (foundWithReactionId) { return foundWithReactionId; }
        throw Error("The reaction that is attempting to be removed does not exist.");
    }
    getUnwantedReaction().users.remove(user.id).then(
        () => console.log(`${user.username}'s reaction was removed at ${Date.now()}`)
    );
}

export const handleReactionAdd = (reaction?: MessageReaction, user?: User | PartialUser): void => {
    if (!user || !reaction) {
        throw Error("Somehow a handle reaction add was called without a reaction or a user.\n" +
            "Something is seriously wrong here.");
    }
    if (reaction.emoji.name === queueEmojiName) {
        const userAlreadyExistsInQueue = !!queuedPlayers && !!queuedPlayers.find(qp => qp.user === user);
        if (!userAlreadyExistsInQueue) {
            queuedPlayers.push({user: user, timestamp: new Date(), warned: false});
            if (queuedPlayers.length < matchSize) {
                updateQueueEmbed(queueEmbedProps, reaction);
            } else {
                Teams(BotActionOptions.initialize, reaction, user, [...queuedPlayers.map(p => p.user)]);
                queuedPlayers = [];
            }
        }
    } else {
        removeReaction(reaction, user);
    }
};

const handleReactionRemove = (reaction?: MessageReaction, user?: User | PartialUser): void => {
    if (!user || !reaction) return;
    if (reaction.emoji.name === queueEmojiName) {
        const userIsQueued = queuedPlayers.length > 0 && queuedPlayers.find(p => p.user === user);
        userIsQueued && queuedPlayers.splice(queuedPlayers.map(p => p.user).indexOf(user), 1);
        updateQueueEmbed(queueEmbedProps, reaction);
    }
};

const buildQueueEmbed = (qec: QueueEmbedProps): MessageEmbed => {
    return new MessageEmbed()
        .setColor(qec.color)
        .setTitle(qec.title)
        .setThumbnail(qec.thumbnail)
        .addField(qec.mapPoolField.name, qec.mapPoolField.value, qec.mapPoolField.inline)
        .addField(qec.inQueueField.name, qec.mapPoolField.value, qec.mapPoolField.inline);
}

const sendInitialEmbed = (props: QueueEmbedProps) => {
    const channel: Channel | undefined = client.channels.cache.get(channelId);
    const textChannel: TextChannel = getTextChannel(channel);

    textChannel.send(buildQueueEmbed(props)).then(m => {
        queueMsgId = m.id;
        m.react(queueEmojiId).then();
    });
};

const updateQueueEmbed = (props: QueueEmbedProps, reaction?: MessageReaction, removedUser?: User | PartialUser) => {
    if (reaction) {
        reaction.message.edit(buildQueueEmbed(props)).then();
    } else if (removedUser) {
        const channel: Channel | undefined = client.channels.cache.get(channelId);
        const textChannel: TextChannel = getTextChannel(channel);
        const queueMsg = textChannel.messages.cache.get(queueMsgId);
        const queueReactions = queueMsg && queueMsg.reactions.cache.get(queueEmojiIdNum);

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
export let queuedPlayers: QueuedPlayer[];
const getPlayerCount = (): string => queuedPlayers ? queuedPlayers.length.toString() : '0';
const getPlayersValue = (): string => queuedPlayers.length > 0 ?
    queuedPlayers.map(p => p.user).toString() :
    defaultValueForEmptyTeam;

const queueEmbedProps: QueueEmbedProps = {
    color: queueEmbedColor ? queueEmbedColor : defaultEmbedColor,
    title: queueEmbedTitle,
    thumbnail: queueEmbedThumbnailUrl ? queueEmbedThumbnailUrl : defaultEmbedThumbnailUrl,
    mapPoolField: {name: "Map Pool", value: mapPool.toString(), inline: true},
    inQueueField: {name: `In Queue - ${getPlayerCount()}/${matchSize}`, value: getPlayersValue(), inline: false}
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
            sendInitialEmbed(queueEmbedProps);
            break;
        case BotActionOptions.reactionAdd:
            handleReactionAdd(reaction, user);
            break;
        case BotActionOptions.reactionRemove:
            handleReactionRemove(reaction, user);
            break;
        case BotActionOptions.update:
            updateQueueEmbed(queueEmbedProps, undefined, removedUser)
            break;
        default:
            break;
    }
};