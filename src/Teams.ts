import {MessageEmbed, MessageReaction, PartialUser, StringResolvable, User} from "discord.js";
import {
    admins,
    blueTeamEmojiId,
    blueTeamEmojiName,
    BotAction,
    BotActionOptions,
    channelFullPath,
    defaultEmbedColor,
    defaultEmbedThumbnailUrl,
    defaultValueForEmptyTeam,
    directMessageEmbedColor,
    directMessageName,
    directMessageThumbnailUrl,
    directMessageTitle,
    matchSize,
    redTeamEmojiId,
    redTeamEmojiName,
    resetPugEmojiName,
    resetTeamsEmojiName,
    teamsEmbedColor,
    teamsEmbedThumbnailUrl,
    teamsEmbedTitle,
    teamSize
} from "./Api";
import {EmbedField, Queue, queuedPlayers, removeReaction} from "./Queue";
import {Hourglass, suggestedMaps} from "./Hourglass";
import {textChannel} from "./Bot";
import {Maps} from "./Maps";

export let tmMsgId: string;
export let unassignedPlayers: (User | PartialUser)[] = [];
export let redTeamPlayers: (User | PartialUser)[];
export let blueTeamPlayers: (User | PartialUser)[];

type TeamsEmbedProps = {
    author: StringResolvable,
    color: StringResolvable,
    title: StringResolvable,
    thumbnail: StringResolvable,
    redTeamField: EmbedField,
    blueTeamField: EmbedField,
    unassignedPlayersField: EmbedField
};

type DirectMessageEmbedProps = {
    color: StringResolvable,
    title: StringResolvable,
    timestamp: Date,
    thumbnail: StringResolvable,
    field: EmbedField
};

export const wipeTeams = () => {
    redTeamPlayers = [];
    blueTeamPlayers = [];
};

const getUnassignedPlayers = (): (User | PartialUser)[] => unassignedPlayers;
const getRedTeamPlayers = (): (User | PartialUser)[] => redTeamPlayers;
const getBlueTeamPlayers = (): (User | PartialUser)[] => blueTeamPlayers;

const getTeamsEmbedProps = (): TeamsEmbedProps => {
    return {
        author: `Suggested Map: ${suggestedMaps[1]}`,
        color: teamsEmbedColor ? teamsEmbedColor : defaultEmbedColor,
        title: teamsEmbedTitle,
        thumbnail: teamsEmbedThumbnailUrl ? teamsEmbedThumbnailUrl : defaultEmbedThumbnailUrl,
        redTeamField: {
            name: "Map Pool",
            value: getRedTeamPlayers() ? getRedTeamPlayers() : defaultValueForEmptyTeam,
            inline: true
        },
        blueTeamField: {
            name: "In Queue",
            value: getBlueTeamPlayers() ? getBlueTeamPlayers() : defaultValueForEmptyTeam,
            inline: true
        },
        unassignedPlayersField: {name: "Unassigned Players", value: getUnassignedPlayers(), inline: false}
    };
};

const directMessageEmbedProps: DirectMessageEmbedProps = {
    color: directMessageEmbedColor ? directMessageEmbedColor : defaultEmbedColor,
    title: directMessageTitle,
    timestamp: new Date(),
    thumbnail: directMessageThumbnailUrl ? directMessageThumbnailUrl : defaultEmbedThumbnailUrl,
    field: {
        name: directMessageName,
        value: `Click [here](${channelFullPath}) to be taken back to the PUG Bot :)`,
        inline: false
    }
};

const buildTeamsEmbed = (props: TeamsEmbedProps): MessageEmbed => {
    return new MessageEmbed()
        .setAuthor(props.author)
        .setColor(props.color)
        .setTitle(props.title)
        .setThumbnail(props.thumbnail)
        .addFields(props.redTeamField, props.blueTeamField, props.unassignedPlayersField)

};

const sendDirectMessageToQueuedPlayers = (props: DirectMessageEmbedProps) => {
    unassignedPlayers.map(u => u.send(
        new MessageEmbed()
            .setColor(props.color)
            .setTitle(props.title)
            .setTimestamp(props.timestamp)
            .setThumbnail(props.thumbnail)
            .addField(props.field.name, props.field.value, props.field.inline)
    ))
};

const sendInitialTeamsEmbed = (reaction: MessageReaction, props: TeamsEmbedProps) => {
    reaction.message.delete().then(() => {
        textChannel.send(buildTeamsEmbed(props)).then(m => {
            tmMsgId = m.id;
            m.react(redTeamEmojiId);
            m.react(blueTeamEmojiId);
        });
        sendDirectMessageToQueuedPlayers(directMessageEmbedProps);
    })

};

const updateTeams = (reaction: MessageReaction, teamsReset: boolean) => {
    reaction.message.edit(buildTeamsEmbed(getTeamsEmbedProps())).then(m => {
        tmMsgId = m.id;
        teamsReset && m.react(redTeamEmojiId);
        teamsReset && m.react(blueTeamEmojiId);
    })
};

const resetTeams = (reaction: MessageReaction) => {
    unassignedPlayers.push(...redTeamPlayers);
    unassignedPlayers.push(...blueTeamPlayers);
    wipeTeams();
    reaction.message.reactions.removeAll().then(() => updateTeams(reaction, true));
};

const resetPug = (reaction: MessageReaction) => {
    unassignedPlayers = [];
    wipeTeams();
    queuedPlayers.splice(0, queuedPlayers.length);
    Queue(BotActionOptions.initialize);
    Hourglass();
};

const removeRedTeamReaction = (reaction: MessageReaction, user: User | PartialUser) => {
    if (!!redTeamPlayers && !!redTeamPlayers.find(u => u === user)) {
        redTeamPlayers.splice(redTeamPlayers.indexOf(user), 1);
        unassignedPlayers.push(user);
        updateTeams(reaction, false);
    }
};

const removeBlueTeamReaction = (reaction: MessageReaction, user: User | PartialUser) => {
    if (!!blueTeamPlayers && !!blueTeamPlayers.find(u => u === user)) {
        blueTeamPlayers.splice(blueTeamPlayers.indexOf(user), 1);
        unassignedPlayers.push(user);
        updateTeams(reaction, false);
    }
};

const handleReactionAdd = (reaction: MessageReaction, user: User | PartialUser) => {
    const playerIsQueued: boolean = !!unassignedPlayers.find(u => u === user) ||
        !!redTeamPlayers.find(u => u === user) ||
        !!blueTeamPlayers.find(u => u === user);
    const isAdmin: boolean = !!admins && !!admins.find(a => a.valueOf() === user.presence?.userID);
    const checkIfTeamsAreFull = (): boolean => ((redTeamPlayers.length + blueTeamPlayers.length) == matchSize);

    const handleTeamReaction = (
        myTeamPlayers: (User | PartialUser)[],
        theirTeamPlayers: (User | PartialUser)[],
        myTeamEmojiId: string
    ) => {
        if (playerIsQueued && !theirTeamPlayers.find(u => u === user) && myTeamPlayers.length < teamSize) {
            myTeamPlayers === redTeamPlayers ? redTeamPlayers.push(user) : blueTeamPlayers.push(user);
            unassignedPlayers.splice(unassignedPlayers.indexOf(user), 1);
            updateTeams(reaction, false);
        } else {
            const getReaction = (reaction: MessageReaction, myTeamEmojiId: string) => {
                const fetchedReaction = reaction.message.reactions.cache.get(myTeamEmojiId);
                if (!fetchedReaction) throw Error(
                    "No Reaction was found when trying to remove Reaction from Embed Message."
                )
                return fetchedReaction;
            };
            getReaction(reaction, myTeamEmojiId).users.remove(user.id).then(
                () => console.log(`${user.username}'s reaction was removed at ${Date.now()}`)
            );
        }
        if (checkIfTeamsAreFull()) {
            Maps(BotActionOptions.initialize, reaction, user)
        }
    };

    if (playerIsQueued || isAdmin) {
        switch (reaction.emoji.name) {
            case redTeamEmojiName:
                handleTeamReaction(redTeamPlayers, blueTeamPlayers, redTeamEmojiId);
                break;
            case blueTeamEmojiName:
                handleTeamReaction(blueTeamPlayers, redTeamPlayers, blueTeamEmojiId);
                break;
            case resetTeamsEmojiName:
                resetTeams(reaction);
                break;
            case resetPugEmojiName:
                resetPug(reaction);
                break;
            default:
                removeReaction(reaction, user);
                break;
        }
    }

};

const handleReactionRemove = (reaction: MessageReaction, user: User | PartialUser) => {
    switch (reaction.emoji.name) {
        case redTeamEmojiName:
            removeRedTeamReaction(reaction, user);
            break;
        case blueTeamEmojiName:
            removeBlueTeamReaction(reaction, user);
            break;
        default:
            break;
    }
};

export const Teams = (
    action: BotAction,
    reaction: MessageReaction,
    user: User | PartialUser,
    queuedPlayers?: (User | PartialUser)[]
) => {
    switch (action) {
        case BotActionOptions.initialize:
            if (!queuedPlayers) throw Error("There are no Queued Players to form Teams from.");
            unassignedPlayers = [...queuedPlayers];
            sendInitialTeamsEmbed(reaction, getTeamsEmbedProps());
            break;
        case BotActionOptions.reactionAdd:
            handleReactionAdd(reaction, user);
            break;
        case BotActionOptions.reactionRemove:
            handleReactionRemove(reaction, user);
            break;
        default:
            break;
    }
};