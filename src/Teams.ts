import {MessageEmbed, MessageReaction, PartialUser, StringResolvable, User} from "discord.js";
import {
    admins,
    blueTeamEmojiId,
    blueTeamEmojiIdNum,
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
    getTeamName,
    matchSize,
    redTeamEmojiId,
    redTeamEmojiIdNum,
    redTeamEmojiName,
    resetPugEmojiName,
    resetTeamsEmojiName,
    TeamNameOptions,
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

export class TeamEmoji {
    public id: string;
    public idNum: string;
    public name: string;

    constructor(id: string, idNum: string, name: string) {
        this.id = id;
        this.idNum = idNum;
        this.name = name;
    }

}

export class Team {
    public name: string;
    public players: (User | PartialUser)[];
    public emoji: TeamEmoji;

    constructor(name: string, players: (User | PartialUser)[], emoji: TeamEmoji) {
        this.name = name;
        this.players = players;
        this.emoji = emoji;
    };

}

let getTeamEmoji = (whichTeam: TeamNameOptions) => {
    if (whichTeam === TeamNameOptions.red) {
        return new TeamEmoji(redTeamEmojiId, redTeamEmojiIdNum, redTeamEmojiName);
    } else if (whichTeam === TeamNameOptions.blue) {
        return new TeamEmoji(blueTeamEmojiId, blueTeamEmojiIdNum, blueTeamEmojiName);
    } else {
        throw Error("Unable to find team name that was outside the scope of these two teams.");
    }
};

export let unassignedPlayers: (User | PartialUser)[] = [];

//TODO can these object instances be consts and still have their values changes? Probably...
export const redTeam: Team = new Team(
    getTeamName(TeamNameOptions.red),
    [],
    getTeamEmoji(TeamNameOptions.red)
);
export const blueTeam: Team = new Team(
    getTeamName(TeamNameOptions.blue),
    [],
    getTeamEmoji(TeamNameOptions.blue)
);

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
    redTeam.players = [];
    blueTeam.players = [];
};

const getUnassignedPlayers = (): (User | PartialUser)[] => unassignedPlayers;
const getRedTeamPlayers = (): (User | PartialUser)[] => redTeam.players;
const getBlueTeamPlayers = (): (User | PartialUser)[] => blueTeam.players;

const getTeamsEmbedProps = (): TeamsEmbedProps => {
    return {
        author: `Suggested Map: ${suggestedMaps[1]}`,
        color: teamsEmbedColor ? teamsEmbedColor : defaultEmbedColor,
        title: teamsEmbedTitle,
        thumbnail: teamsEmbedThumbnailUrl ? teamsEmbedThumbnailUrl : defaultEmbedThumbnailUrl,
        redTeamField: {
            name: "Map Pool",
            value: getRedTeamPlayers().length > 0 ? getRedTeamPlayers() : defaultValueForEmptyTeam,
            inline: true
        },
        blueTeamField: {
            name: "In Queue",
            value: getBlueTeamPlayers().length > 0 ? getBlueTeamPlayers() : defaultValueForEmptyTeam,
            inline: true
        },
        unassignedPlayersField: {name: "Unassigned Players", value: getUnassignedPlayers(), inline: false}
    };
};

const getDirectMessageEmbedProps = (): DirectMessageEmbedProps => {
    return {
        color: directMessageEmbedColor ? directMessageEmbedColor : defaultEmbedColor,
        title: directMessageTitle,
        timestamp: new Date(),
        thumbnail: directMessageThumbnailUrl ? directMessageThumbnailUrl : defaultEmbedThumbnailUrl,
        field: {
            name: directMessageName,
            value: `Click [here](${channelFullPath}) to be taken back to the PUG Bot :)`,
            inline: false
        }
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
            sendDirectMessageToQueuedPlayers(getDirectMessageEmbedProps());
        });
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
    unassignedPlayers.push(...redTeam.players);
    unassignedPlayers.push(...blueTeam.players);
    wipeTeams();
    reaction.message.reactions.removeAll().then(() => updateTeams(reaction, true));
};

const resetPug = (reaction: MessageReaction) => {
    unassignedPlayers = [];
    wipeTeams();
    queuedPlayers.splice(0, queuedPlayers.length);
    reaction.message.delete().then(() => {
        Queue(BotActionOptions.initialize);
        Hourglass();
    })

};

const removeRedTeamReaction = (reaction: MessageReaction, user: User | PartialUser) => {
    if (!!redTeam.players && !!redTeam.players.find(u => u === user)) {
        redTeam.players.splice(redTeam.players.indexOf(user), 1);
        unassignedPlayers.push(user);
        updateTeams(reaction, false);
    }
};

const removeBlueTeamReaction = (reaction: MessageReaction, user: User | PartialUser) => {
    if (!!blueTeam.players && !!blueTeam.players.find(u => u === user)) {
        blueTeam.players.splice(blueTeam.players.indexOf(user), 1);
        unassignedPlayers.push(user);
        updateTeams(reaction, false);
    }
};

const handleReactionAdd = (reaction: MessageReaction, user: User | PartialUser) => {
    const playerIsQueued: boolean = !!unassignedPlayers.find(u => u === user) ||
        !!redTeam.players.find(u => u === user) ||
        !!blueTeam.players.find(u => u === user);
    const isAdmin: boolean = !!admins && !!admins.find(a => a.valueOf() === user.presence?.userID);
    const checkIfTeamsAreFull = (): boolean => ((redTeam.players.length + blueTeam.players.length) == matchSize);

    const handleTeamReaction = (
        myTeamPlayers: (User | PartialUser)[],
        theirTeamPlayers: (User | PartialUser)[],
        myTeamEmojiIdNum: string
    ) => {

        if (playerIsQueued && !theirTeamPlayers.find(u => u === user) && myTeamPlayers.length < teamSize) {
            myTeamPlayers === redTeam.players ? redTeam.players.push(user) : blueTeam.players.push(user);
            unassignedPlayers.splice(unassignedPlayers.indexOf(user), 1);
            if (checkIfTeamsAreFull()) {
                reaction.message.delete().then(() => Maps(BotActionOptions.initialize, reaction, user));
            } else {
                updateTeams(reaction, false);
            }
        } else {
            const getReaction = (reaction: MessageReaction, myTeamEmojiIdNum: string) => {
                const fetchedReaction = reaction.message.reactions.cache.get(myTeamEmojiIdNum);
                if (!fetchedReaction) throw Error(
                    "No Reaction was found when trying to remove Reaction from Embed Message."
                )
                return fetchedReaction;
            };
            getReaction(reaction, myTeamEmojiIdNum).users.remove(user.id).then(
                () => console.log(`${user.username}'s reaction was removed at ${Date.now()}`)
            );
        }
    };

    if (playerIsQueued || isAdmin) {
        switch (reaction.emoji.name) {
            case redTeamEmojiName:
                // handleTeamReaction(redTeam.players, blueTeam.players, redTeamEmojiIdNum);
                handleTeamReaction(redTeam.players, blueTeam.players, redTeamEmojiId);
                break;
            case blueTeamEmojiName:
                // handleTeamReaction(blueTeam.players, redTeam.players, blueTeamEmojiIdNum);
                handleTeamReaction(blueTeam.players, redTeam.players, blueTeamEmojiId);
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