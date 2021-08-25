import {Channel, MessageEmbed, MessageReaction, PartialUser, TextChannel, User} from "discord.js";
import {client} from "./Bot";
import {
    BotAction,
    BotActionOptions,
    channelId,
    defaultValueForEmptyTeam,
    matchSize,
    queueEmojiIdNum,
    queueEmojiName
} from "./Api";

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

type QueueEmbedConstructor = {
    color: string,
    title: string,
    thumbnail: string,
    mapPoolField: EmbedAddField,
    inQueueField: EmbedAddField
}

export const getChannel = (channel: Channel | undefined): TextChannel => {
    const isChannelATextChannel = channel instanceof TextChannel;
    if (!isChannelATextChannel) throw Error(
        "Error: Your channel is not a Text Channel. Please correct your Channel ID"
    );
    return <TextChannel>channel;
};

const removeReaction = (reaction: MessageReaction, user: User | PartialUser) => {
    const reactionName: string = reaction.emoji.name;
    const reactionId: string = reaction.emoji.id ? reaction.emoji.id : "";
    const removeUnwantedReaction: MessageReaction | undefined = reaction.message.reactions.cache.get(reactionName) ?
        reaction.message.reactions.cache.get(reactionName) :
        reaction.message.reactions.cache.get(reactionId);
    removeUnwantedReaction && removeUnwantedReaction.users.remove(user.id).then(
        () => console.log(`${user.username}'s reaction was removed at ${Date.now()}`)
    )
}

export const handleReactionAdd = (reaction?: MessageReaction, user?: User | PartialUser): void => {
    if (!user || !reaction) return;
    if (reaction.emoji.name === queueEmojiName) {
        const userAlreadyExistsInQueue = !!queuedPlayers && !!queuedPlayers.find(qp => qp.user === user);
        if (!userAlreadyExistsInQueue) {
            queuedPlayers.push({user: user, timestamp: new Date(), warned: false});
            if (queuedPlayers.length < matchSize) {
                updateQueueEmbed(/*TODO: change*/initialEmbedConstructor, reaction)
            } else {
                //TODO: Teams("initialize", reaction, user,[...queuedPlayers.map(p => p.user)])
                queuedPlayers = []
            }
        }
    } else {
        removeReaction(reaction, user);
    }
};

const handleReactionRemove = (reaction?: MessageReaction, user?: User | PartialUser): void => {
    if (!user || !reaction) return;
    if (reaction.emoji.name === queueEmojiName) {
        const userIsQueued = queuedPlayers.find(p => p.user === user);
        queuedPlayers && userIsQueued && queuedPlayers.splice(queuedPlayers.map(p => p.user).indexOf(user), 1);
        updateQueueEmbed(/*TODO: change*/initialEmbedConstructor, reaction);
    }
}

const sendInitialEmbed = (iec: QueueEmbedConstructor) => {
    const initialEmbed = new MessageEmbed()
        .setColor(iec.color)
        .setTitle(iec.title)
        .setThumbnail(iec.thumbnail)
        .addField(iec.mapPoolField.name, iec.mapPoolField.value, iec.mapPoolField.inline)
        .addField(iec.inQueueField.name, iec.mapPoolField.value, iec.mapPoolField.inline);

    const channel: Channel | undefined = client.channels.cache.get(channelId);
    const textChannel: TextChannel = getChannel(channel);

    textChannel.send(initialEmbed).then(m => {
        queueMsgId = m.id;
        //react
    });
};

const updateQueueEmbed = (uqec: QueueEmbedConstructor, reaction?: MessageReaction, removedUser?: User | PartialUser) => {
    const updatedEmbed = new MessageEmbed()
        .setColor(uqec.color)
        .setTitle(uqec.title)
        .setThumbnail(uqec.thumbnail)
        .addField(uqec.mapPoolField.name, uqec.mapPoolField.value, uqec.mapPoolField.inline)
        .addField(`In Queue - ${getPlayerCount()}/${matchSize}`, getPlayersValue(), false);

    if (reaction) {
        reaction.message.edit(updatedEmbed).then();
    } else if (removedUser) {
        //TODO: remove ts-ignore
        // @ts-ignore
        client.channels.cache.get(channelId).lastMessage.edit(updatedEmbed).then(
            () => console.log(`${removedUser.username} was removed from the queue at ${Date.now()}`)
        )
        //TODO: remove ts-ignore
        // @ts-ignore
        removedUser && client.channels.cache.get(channelId).lastMessage.reactions.cache.get(queueEmojiIdNum)
            .users.remove(removedUser.id).then(
                () => console.log(`${removedUser.username}'s reaction was removed from queue`)
            )
    }
}

export let queueMsgId: string;
export let queuedPlayers: QueuedPlayer[];
const getPlayerCount = (): string => queuedPlayers ? queuedPlayers.length.toString() : '0';
const getPlayersValue = (): string => queuedPlayers.length > 0 ?
    queuedPlayers.map(p => p.user).toString() :
    defaultValueForEmptyTeam;

const initialEmbedConstructor: QueueEmbedConstructor = {
    color: "#ff0000",
    title: "Reaction Based PUG Bot",
    thumbnail: "https://www.example.com",
    mapPoolField: {name: "Map Pool", value: "This map, that map, all maps", inline: true},
    inQueueField: {name: `In Queue - ${getPlayerCount()}/10`, value: getPlayersValue(), inline: false}
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
            sendInitialEmbed(initialEmbedConstructor);
            break;
        case BotActionOptions.reactionAdd:
            handleReactionAdd(reaction, user);
            break;
        case BotActionOptions.reactionRemove:
            handleReactionRemove(reaction, user);
            break;
        case BotActionOptions.update:
            updateQueueEmbed(/*TODO: change*/initialEmbedConstructor, undefined, removedUser)
            break;
        default:
            break;
    }
};