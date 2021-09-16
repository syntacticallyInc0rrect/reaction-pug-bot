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
    getTeamName,
    redTeamEmojiId,
    redTeamEmojiIdNum,
    redTeamEmojiName,
    redTeamName,
    resetPugEmojiName,
    TeamNameOptions,
} from "./Api";
import {Message, MessageEmbed, MessageReaction, PartialUser, StringResolvable, User} from "discord.js";
import {EmbedField, Queue, queuedPlayers, removeReaction} from "./Queue";
import {addActivePug, guild, increasePugCount, pugCount, textChannel} from "./Bot";
import {MapVote} from "./MapVote";
import {Team} from "./Teams";

export let cptMsgId: string = "";
let pickIndex: number = 0;

let reactions: string[] = [
    "💥", "💣", "💪", "🧠", "👀", "🐵", "🦄", "🐀", "🦈", "🐌",
    "🌺", "🌴", "☘", "🍒", "🧀", "🌭", "🌮", "🍕", "🥣", "🦞",
    "🧁", "🍼", "🍺", "🌍", "🗻", "⛩", "🚕", "🚲", "⚓", "🚀",
    "🛎", "⭐", "❄", "⚡", "⚽", "🏈", "🏓", "⛸", "🎯", "🎱",
    "🕹", "🧸", "🎭", "🎨", "👘", "👑", "💎", "🎼", "🎻", "📷",
    "💲", "📭", "💼", "🏹", "🧪", "🧲", "🧬", "⚰", "🚽", "🚮",
    "⚔"
];

let voteReactions: string[] = [];
let unassignedPlayers: CaptainPickPlayer[] = [];
let teamCaptains: (User | PartialUser)[] = [];

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

export const wipeTeams = () => {
    redTeam.players = [];
    blueTeam.players = [];
};

type CaptainPickPlayer = {
    user: User | PartialUser,
    reaction: string,
}

type CaptainsEmbedProps = {
    author: StringResolvable,
    color: StringResolvable,
    title: StringResolvable,
    thumbnail: StringResolvable,
    redTeamField: EmbedField,
    blueTeamField: EmbedField,
    unassignedPlayersField: EmbedField
};

const resetPug = (reaction: MessageReaction) => {
    unassignedPlayers = [];
    wipeTeams();
    queuedPlayers.splice(0, queuedPlayers.length);
    voteReactions = [];
    teamCaptains = [];
    reaction.message.delete().then(() => {
        Queue(BotActionOptions.initialize);
    })

};

export const Captains = (
    action: BotAction,
    reaction: MessageReaction,
    user: User | PartialUser,
    queuedPlayers?: (User | PartialUser)[]
) => {

    const buildUnassignedPlayers = (users: (User | PartialUser)[]) => {
        voteReactions = [];
        for (let i = 0; i < users.length; i++) {
            const reaction: string = reactions[Math.floor(Math.random() * reactions.length)];
            voteReactions.push(reaction);
            reactions.splice(reactions.indexOf(reaction), 1);

            unassignedPlayers.push({user: users[i], reaction: reaction});
        }
    }

    const assignRandomTeamCaptains = () => {
        teamCaptains = [];
        redTeam.players = [];
        blueTeam.players = [];

        const firstRandomCaptain: CaptainPickPlayer =
            unassignedPlayers[Math.floor(Math.random() * unassignedPlayers.length)];
        teamCaptains.push(firstRandomCaptain.user);
        redTeam.players.push(firstRandomCaptain.user);
        const firstReaction = unassignedPlayers[unassignedPlayers.indexOf(firstRandomCaptain)].reaction;
        voteReactions.splice(voteReactions.indexOf(firstReaction), 1);
        reactions.push(firstReaction);
        unassignedPlayers.splice(unassignedPlayers.indexOf(firstRandomCaptain), 1);

        const secondRandomCaptain: CaptainPickPlayer =
            unassignedPlayers[Math.floor(Math.random() * unassignedPlayers.length)];
        teamCaptains.push(secondRandomCaptain.user);
        blueTeam.players.push(secondRandomCaptain.user);
        const secondReaction = unassignedPlayers[unassignedPlayers.indexOf(secondRandomCaptain)].reaction;
        voteReactions.splice(voteReactions.indexOf(secondReaction), 1);
        reactions.push(firstReaction);
        unassignedPlayers.splice(unassignedPlayers.indexOf(secondRandomCaptain), 1);
    };

    const getCaptainsEmbedProps = (): CaptainsEmbedProps => {
        const getPlayerName = (user: User | PartialUser): StringResolvable => {
            return guild.members.cache.find(gm => gm.user === user)?.nickname ?
                guild.members.cache.find(gm => gm.user === user)!.nickname :
                user.username;
        };

        const title: StringResolvable = pickIndex === 0 ?
            `${getPlayerName(teamCaptains[0])}, you get first pick!` :
            (pickIndex % 2) ?
                `${getPlayerName(teamCaptains[1])}, your pick` :
                `${getPlayerName(teamCaptains[0])}, your pick`;

        const redTeamEmoji: StringResolvable = `${redTeamEmojiId !== "" ? redTeamEmojiId : redTeamEmojiName}`;
        const blueTeamEmoji: StringResolvable = `${blueTeamEmojiId !== "" ? blueTeamEmojiId : blueTeamEmojiName}`;

        const author: string = `Captains: ${redTeamEmoji} ${getPlayerName(teamCaptains[0])}, ${blueTeamEmoji} ${getPlayerName(teamCaptains[1])}`;

        return {
            author: author,
            color: defaultEmbedColor,
            title: title,
            thumbnail: defaultEmbedThumbnailUrl,
            redTeamField: {
                name: `${redTeamEmoji} ${redTeamName}`,
                value: redTeam.players.length > 0 ? redTeam.players : defaultValueForEmptyTeam,
                inline: true
            },
            blueTeamField: {
                name: `${blueTeamEmoji} ${blueTeamName}`,
                value: blueTeam.players.length > 0 ? blueTeam.players : defaultValueForEmptyTeam,
                inline: true
            },
            unassignedPlayersField: {
                name: "Unassigned Players",
                value: unassignedPlayers.length > 0 ?
                    unassignedPlayers.map(up => `${up.reaction} - ${getPlayerName(up.user)}`) :
                    "N/A",
                inline: false
            }
        };
    };

    const buildCaptainsEmbed = (props: CaptainsEmbedProps) => {
        return new MessageEmbed()
            .setAuthor(props.author)
            .setColor(props.color)
            .setTitle(props.title)
            .setThumbnail(props.thumbnail)
            .addFields(props.redTeamField, props.blueTeamField, props.unassignedPlayersField)
    };

    const reactWithCaptainVoteOptionEmojis = (message: Message) => {
        const reactions: string[] = unassignedPlayers.map(up => up.reaction);
        reactions.forEach(r => message.react(r));
    };

    const sendInitialCaptainsEmbed = (reaction: MessageReaction, props: CaptainsEmbedProps) => {
        reaction.message.delete().then(() => {
            textChannel.send(buildCaptainsEmbed(props)).then(m => {
                cptMsgId = m.id;
                reactWithCaptainVoteOptionEmojis(m);
            })
        })
    };

    const updateCaptainsEmbed = (reaction: MessageReaction) => {
        reaction.message.delete().then(m => m.channel.send(buildCaptainsEmbed(getCaptainsEmbedProps())).then(nm => {
            cptMsgId = nm.id;
            reactWithCaptainVoteOptionEmojis(nm);
        }));
    };

    const createPugChannels = () => {
        let redTeamVoiceChannelId: string;
        let blueTeamVoiceChannelId: string;
        const movePlayersToTeamVoiceChannels = () => {
            guild.members.cache.forEach(m => {
                if (m.voice.channel) {
                    if (redTeam.players.find(p => p.id === m.id)) {
                        m.voice.setChannel(redTeamVoiceChannelId).then();
                    }
                    if (blueTeam.players.find(p => p.id === m.id)) {
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
                    redTeamPlayers: redTeam.players,
                    blueTeamPlayers: blueTeam.players
                };
                addActivePug(pugVoiceChannel);
            })
        });
    };

    const handleReactionAdd = (reaction: MessageReaction, user: User | PartialUser) => {
        const whichCaptain: User | PartialUser = (pickIndex % 2) ? teamCaptains[1] : teamCaptains[0];
        const playerCanMakePick: boolean = user === whichCaptain;
        const playerIsInPug: boolean = !!(teamCaptains.find(tc => tc === user) ||
            unassignedPlayers.find(up => up.user === user));
        const playerIsAdmin: boolean = !!admins && !!admins.find(a => a.valueOf() === user.presence?.userID);

        if (playerCanMakePick && voteReactions.find(r => r === reaction.emoji.name)) {
            const player: CaptainPickPlayer | undefined = unassignedPlayers.find(
                up => up.reaction === reaction.emoji.name
            );

            if (player) {
                if (pickIndex % 2) {
                    blueTeam.players.push(player.user);
                } else {
                    redTeam.players.push(player.user);
                }
                reactions.push(player.reaction);
                voteReactions.splice(voteReactions.indexOf(player.reaction), 1);
                unassignedPlayers.splice(unassignedPlayers.indexOf(player), 1);
                pickIndex++;
                if (unassignedPlayers.length < 1) {
                    createPugChannels();
                    reaction.message.delete().then(() => {
                    });
                    MapVote(BotActionOptions.initialize, reaction, user);
                    pickIndex = 0;
                } else {
                    updateCaptainsEmbed(reaction);
                }
            } else {
                removeReaction(reaction, user);
            }
        } else if ((playerIsInPug || playerIsAdmin) && reaction.emoji.name === resetPugEmojiName) {
            resetPug(reaction);
        } else {
            removeReaction(reaction, user);
        }
    };

    switch (action) {
        case BotActionOptions.initialize:
            if (!queuedPlayers) throw Error("There are no Queued Players to form Teams from.");
            buildUnassignedPlayers(queuedPlayers);
            assignRandomTeamCaptains();
            pickIndex = 0;
            sendInitialCaptainsEmbed(reaction, getCaptainsEmbedProps());
            break;
        case BotActionOptions.reactionAdd:
            handleReactionAdd(reaction, user);
            break;
        default:
            break;
    }
};