import {MessageEmbed, MessageReaction, PartialUser, StringResolvable, User} from "discord.js";
import {
    ActivePug,
    admins,
    blueTeamEmojiId,
    blueTeamEmojiIdNum,
    blueTeamEmojiName,
    blueTeamName,
    BotAction,
    BotActionOptions,
    defaultEmbedColor,
    defaultEmbedThumbnailUrl,
    defaultValueForEmptyTeam,
    directMessageName,
    directMessageThumbnailUrl,
    directMessageTitle,
    getChannelFullPath,
    getTeamName,
    matchSize,
    redTeamEmojiId,
    redTeamEmojiIdNum,
    redTeamEmojiName,
    redTeamName,
    resetPugEmojiName,
    resetTeamsEmojiName,
    TeamNameOptions,
    teamsEmbedThumbnailUrl,
    teamsEmbedTitle,
    teamSize
} from "./Api";
import {EmbedField, Queue, queuedPlayers, removeReaction} from "./Queue";
import {suggestedMaps} from "./Hourglass";
import {addActivePug, guild, increasePugCount, pugCount, textChannel} from "./Bot";
import {Maps} from "./Maps";

export let tmMsgId: string;

export class Team {
    public name: string;
    public players: (User | PartialUser)[];
    public reactionEmoji: string;

    constructor(name: string, players: (User | PartialUser)[], reactionEmoji: string) {
        this.name = name;
        this.players = players;
        this.reactionEmoji = reactionEmoji;
    };

}

export let unassignedPlayers: (User | PartialUser)[] = [];

const redTeamReaction: string = redTeamEmojiIdNum !== "" ? redTeamEmojiIdNum : redTeamEmojiName;
const blueTeamReaction: string = blueTeamEmojiIdNum !== "" ? blueTeamEmojiIdNum : blueTeamEmojiName;

export const redTeam: Team = new Team(
    getTeamName(TeamNameOptions.red),
    [],
    redTeamReaction
);
export const blueTeam: Team = new Team(
    getTeamName(TeamNameOptions.blue),
    [],
    blueTeamReaction
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
        color: defaultEmbedColor,
        title: teamsEmbedTitle,
        thumbnail: teamsEmbedThumbnailUrl ? teamsEmbedThumbnailUrl : defaultEmbedThumbnailUrl,
        redTeamField: {
            name: `${redTeamEmojiId !== "" ? redTeamEmojiId : redTeamEmojiName} ${redTeamName}`,
            value: getRedTeamPlayers().length > 0 ? getRedTeamPlayers() : defaultValueForEmptyTeam,
            inline: true
        },
        blueTeamField: {
            name: `${blueTeamEmojiId !== "" ? blueTeamEmojiId : blueTeamEmojiName} ${blueTeamName}`,
            value: getBlueTeamPlayers().length > 0 ? getBlueTeamPlayers() : defaultValueForEmptyTeam,
            inline: true
        },
        unassignedPlayersField: {name: "Unassigned Players", value: getUnassignedPlayers(), inline: false}
    };
};

const getDirectMessageEmbedProps = (): DirectMessageEmbedProps => {
    return {
        color: defaultEmbedColor,
        title: directMessageTitle,
        timestamp: new Date(),
        thumbnail: directMessageThumbnailUrl ? directMessageThumbnailUrl : defaultEmbedThumbnailUrl,
        field: {
            name: directMessageName,
            value: `Click [here](${getChannelFullPath()}) to be taken back to the PUG Bot :)`,
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
            m.react(redTeamReaction).then();
            m.react(blueTeamReaction).then(() => sendDirectMessageToQueuedPlayers(getDirectMessageEmbedProps()));
        });
    });
};

const createPugChannels = () => {
    let redTeamVoiceChannelId: string;
    let blueTeamVoiceChannelId: string;
    const movePlayersToTeamVoiceChannels = () => {
        guild.members.cache.forEach(m => {
            if (m.voice.channel) {
                if (getRedTeamPlayers().find(p => p.id === m.id)) {
                    m.voice.setChannel(redTeamVoiceChannelId).then();
                }
                if (getBlueTeamPlayers().find(p => p.id === m.id)) {
                    m.voice.setChannel(blueTeamVoiceChannelId).then();
                }
            }
        });
    };

    increasePugCount();

    guild.channels.create(`PUG #${pugCount}`, {
        type: "category"
    }).then(c => {
        guild.channels.create(` 🎮 ${redTeamName}`, {
            parent: c,
            type: "voice"
        }).then(c => redTeamVoiceChannelId = c.id);
        guild.channels.create(` 🎮 ${blueTeamName}`, {
            parent: c,
            type: "voice"
        }).then(c => {
            blueTeamVoiceChannelId = c.id;
            movePlayersToTeamVoiceChannels();
            const pugVoiceChannel: ActivePug = {
                id: pugCount,
                redTeamChannelId: redTeamVoiceChannelId,
                blueTeamChannelId: blueTeamVoiceChannelId,
                messageId: "",
                redTeamPlayers: getRedTeamPlayers(),
                blueTeamPlayers: getBlueTeamPlayers()
            };
            addActivePug(pugVoiceChannel);
        })
    });
};

const updateTeams = (reaction: MessageReaction, teamsReset: boolean) => {
    reaction.message.edit(buildTeamsEmbed(getTeamsEmbedProps())).then(m => {
        tmMsgId = m.id;
        teamsReset && m.react(redTeamReaction);
        teamsReset && m.react(blueTeamReaction);
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
    })

};

const removeTeamReaction = (reaction: MessageReaction, user: User | PartialUser, team: Team) => {
    if (!!team.players && !!team.players.find(u => u === user)) {
        team.players.splice(team.players.indexOf(user), 1);
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
        myTeamReaction: string
    ) => {

        if (playerIsQueued && !theirTeamPlayers.find(u => u === user) && myTeamPlayers.length < teamSize) {
            myTeamPlayers === redTeam.players ? redTeam.players.push(user) : blueTeam.players.push(user);
            unassignedPlayers.splice(unassignedPlayers.indexOf(user), 1);
            if (checkIfTeamsAreFull()) {
                reaction.message.delete().then(() => {
                    createPugChannels();
                    Maps(BotActionOptions.initialize, reaction, user)
                });
            } else {
                updateTeams(reaction, false);
            }
        } else {
            const handleUnwantedReaction = (reaction: MessageReaction, myTeamReaction: string) => {
                const fetchedReaction = reaction.message.reactions.cache.get(myTeamReaction);
                fetchedReaction && fetchedReaction.users.remove(user.id).then(
                    () => console.log(`${user.username}'s reaction was removed at ${Date.now()}`)
                )
            };

            handleUnwantedReaction(reaction, myTeamReaction);
        }
    };

    if (playerIsQueued || isAdmin) {
        switch (reaction.emoji.name) {
            case redTeamEmojiName:
                handleTeamReaction(redTeam.players, blueTeam.players, redTeamReaction);
                break;
            case blueTeamEmojiName:
                handleTeamReaction(blueTeam.players, redTeam.players, blueTeamReaction);
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
    } else {
        removeReaction(reaction, user);
    }

};

const handleReactionRemove = (reaction: MessageReaction, user: User | PartialUser) => {
    switch (reaction.emoji.name) {
        case redTeamEmojiName:
            removeTeamReaction(reaction, user, redTeam);
            break;
        case blueTeamEmojiName:
            removeTeamReaction(reaction, user, blueTeam);
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
