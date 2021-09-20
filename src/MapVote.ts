import {
    Message,
    MessageEmbed,
    MessageReaction,
    PartialUser,
    StringResolvable,
    User
} from "discord.js";
import {BotAction, BotActionOptions, defaultEmbedColor, mapPool, timeToBanMap} from "./Api";
import {EmbedField, removeReaction} from "./Queue";
import {lastThreeMapsPlayed, mapToBePlayed, setMapToBePlayed, textChannel} from "./Bot";
import {Finalize} from "./Finalize";
import {blueTeam, redTeam, tmMsgId} from "./Teams";

export let mapVoteMsgId: string = "";
const mapVoteEmojiList: string[] = [
    "0️⃣",
    "1️⃣",
    "2️⃣",
    "3️⃣",
    "4️⃣",
    "5️⃣",
    "6️⃣",
    "7️⃣",
    "8️⃣",
    "9️⃣",
    "🔟",
    "*️⃣"
];


export class VoteOption {
    public value: string;
    public count: number;
    public emojiName: string;

    public constructor(value: string, count: number, emojiName: string) {
        this.value = value;
        this.count = count;
        this.emojiName = emojiName;
    };

}

export class MapVoteObject {
    public voteOptions: VoteOption[];

    constructor(voteOptions: VoteOption[]) {
        this.voteOptions = voteOptions;
    };

    public getHighestVotedMap = (): string => {
        const randomMap: string = mapPool[Math.floor(Math.random() * mapPool.length)];
        const randomVoteOption: VoteOption | undefined = this.voteOptions.find(o => o.value === randomMap);
        let highestVotedOption = randomVoteOption ? randomVoteOption : this.voteOptions[0];

        //todo: toggle asc with desc so ties are resolved differently every other pug
        this.voteOptions.map(o => {
            if (o.count > highestVotedOption.count) highestVotedOption = o
        });


        return highestVotedOption.value;
    };

}

let voteOptions: VoteOption[] = mapPool.sort().map(m => new VoteOption(m, 0, mapVoteEmojiList[mapPool.indexOf(m)]));
const mapVoteObject = new MapVoteObject(voteOptions);

const resetMapVoteOptions = () => {
    voteOptions = mapPool.sort().map(m => new VoteOption(m, 0, mapVoteEmojiList[mapPool.indexOf(m)]));
    mapVoteObject.voteOptions = voteOptions;
};

let i = 1;

const countdownTimer = () => {
    setTimeout(() => {
        updateMapVote(mapVoteMsgId, i)
        if (i < timeToBanMap) {
            countdownTimer();
            i++
        } else {
            i = 1;
            setMapToBePlayed(mapVoteObject.getHighestVotedMap());
            Finalize(BotActionOptions.initialize, mapVoteMsgId, mapToBePlayed);
            resetMapVoteOptions();
        }
    }, 1000);
};

type MapVoteEmbedProps = {
    color: StringResolvable,
    title: StringResolvable,
    optionFields: EmbedField[]
};

const getMapVoteEmbedProps = (secondsElapsed: number): MapVoteEmbedProps => {
    const secondsRemaining: number = timeToBanMap - secondsElapsed;
    const displaySecondsRemaining: string = secondsRemaining > 0 ? `${secondsRemaining}s` : `${secondsRemaining}`;

    const getVoteOptionFields = (): EmbedField[] => {
        const voteOptionEmbeds: EmbedField[] = voteOptions.map(v => {
            return {
                name: `${v.emojiName} ${v.value}`,
                value: `${v.count}`,
                inline: false
            }
        });
        (lastThreeMapsPlayed.length > 0) && voteOptionEmbeds.unshift({
            name: `Last Played Map${(lastThreeMapsPlayed.length > 1) ? "s" : ""}`,
            value: lastThreeMapsPlayed,
            inline: true
        });
        voteOptionEmbeds.push({
            name: "Timer:",
            value: displaySecondsRemaining,
            inline: true
        });
        return voteOptionEmbeds;
    }

    return {
        color: defaultEmbedColor,
        title: "Vote Which Map to Play",
        optionFields: getVoteOptionFields()
    };
};

const buildMapVoteEmbed = (props: MapVoteEmbedProps): MessageEmbed => {
    return new MessageEmbed()
        .setColor(props.color)
        .setTitle(props.title)
        .addFields(props.optionFields);
};

const reactWithMapVoteOptionEmojis = (message: Message) => {
    const emojis: string[] = mapVoteObject.voteOptions.map(o => o.emojiName);
    emojis.forEach(e => message.react(e));
    setTimeout(() => countdownTimer(), 10000);

}


const updateMapVote = (msgId: string, secondsElapsed: number) => {
    const getMessage = (): Message => {
        const message = textChannel.messages.cache.get(msgId);
        if (!message) throw Error("The Bot Message was not found. This is a problem.");
        return message;
    }
    if (msgId === mapVoteMsgId) {
        getMessage().edit(buildMapVoteEmbed(getMapVoteEmbedProps(secondsElapsed))).then(m => mapVoteMsgId = m.id);
    } else {
        textChannel.send(buildMapVoteEmbed(getMapVoteEmbedProps(secondsElapsed))).then(m => {
            mapVoteMsgId = m.id;
            reactWithMapVoteOptionEmojis(m);
        });
    }
};

export const MapVote = (action: BotAction, reaction: MessageReaction, user: User | PartialUser) => {
    const handleReactionAdd = (reaction: MessageReaction, user: User | PartialUser) => {
        const playerIsInThisPug: boolean = !!redTeam.players.find(u => u === user) ||
            !!blueTeam.players.find(u => u === user);

        if (!playerIsInThisPug) {
            removeReaction(reaction, user);
            return;
        }

        //TODO: can a player vote on all maps, one map, three maps, what?

        if (mapVoteObject.voteOptions.find(e => e.emojiName === reaction.emoji.name)) {
            mapVoteObject.voteOptions.find(e => e.emojiName === reaction.emoji.name)!.count += 1;
        } else {
            removeReaction(reaction, user);
        }
    };

    const handleReactionRemove = (reaction: MessageReaction, user: User | PartialUser) => {
        const playerIsInThisPug: boolean = !!redTeam.players.find(u => u === user) ||
            !!blueTeam.players.find(u => u === user);

        if (mapVoteObject.voteOptions.find(e => e.emojiName === reaction.emoji.name) && playerIsInThisPug) {
            mapVoteObject.voteOptions.find(e => e.emojiName === reaction.emoji.name)!.count -= 1;
        }
    };

    switch (action) {
        case BotActionOptions.initialize:
            resetMapVoteOptions();
            updateMapVote(tmMsgId, 0);
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
