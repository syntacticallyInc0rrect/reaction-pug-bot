import {Message, MessageEmbed, MessageReaction, PartialUser, StringResolvable, User} from "discord.js";
import {
    BotAction,
    BotActionOption,
    defaultEmbedColor,
    getTeamName,
    optionOneEmojiName,
    optionThreeEmojiName,
    optionTwoEmojiName,
    TeamNameOption,
    timeToBanMap
} from "./Api";
import {suggestedMaps} from "./Hourglass";
import {EmbedField, removeReaction} from "./Queue";
import {mapToBePlayed, setMapToBePlayed, textChannel} from "./Bot";
import {Finalize} from "./Finalize";
import {blueTeam, redTeam, tmMsgId} from "./Teams";

export let mapBanMsgId: string = "";

let alreadyVotedOnOptionOne: (User | PartialUser)[] = [];
let alreadyVotedOnOptionTwo: (User | PartialUser)[] = [];
let alreadyVotedOnOptionThree: (User | PartialUser)[] = [];

export class BanOption {
    public value: string;
    public count: number;

    public constructor(value?: string, count?: number) {
        this.value = value ? value : "";
        this.count = count ? count : 0;
    };

}

export class TeamOption {
    public teamName: string;
    public optionOne: BanOption;
    public optionTwo: BanOption;
    public optionThree: BanOption;

    constructor(teamName: string, optionOne: BanOption, optionTwo: BanOption, optionThree: BanOption) {
        this.teamName = teamName;
        this.optionOne = optionOne;
        this.optionTwo = optionTwo;
        this.optionThree = optionThree;
    };

    public getHighestVotedOption = (reverseOrder?: boolean): BanOption => {
        let highestVotedOption: BanOption = !!reverseOrder ? this.optionThree : this.optionOne;
        const optionsArray: BanOption[] = [this.optionOne, this.optionTwo, this.optionThree];
        !!reverseOrder && optionsArray.reverse();
        optionsArray.map(o => { if (o.count > highestVotedOption.count) highestVotedOption = o });

        return highestVotedOption;
    };

}

export class MapBanVote {
    public red: TeamOption;
    public blue: TeamOption;

    constructor(redTeam: TeamOption, blueTeam: TeamOption) {
        this.red = redTeam;
        this.blue = blueTeam;
    };

    public getTeamByTeamName = (teamName: string): TeamOption => {
        if (teamName === this.red.teamName) {
            return this.red;
        } else if (teamName === this.blue.teamName) {
            return this.blue;
        } else {
            throw Error(`Team Name: ${teamName}, was not found in MapBanVote Object.`);
        }

    };

}

const redBanOptionOne = new BanOption();
const redBanOptionTwo = new BanOption();
const redBanOptionThree = new BanOption();
const blueBanOptionOne = new BanOption();
const blueBanOptionTwo = new BanOption();
const blueBanOptionThree = new BanOption();
const redTeamOption = new TeamOption(getTeamName(TeamNameOption.red), redBanOptionOne, redBanOptionTwo, redBanOptionThree);
const blueTeamOption = new TeamOption(getTeamName(TeamNameOption.blue), blueBanOptionOne, blueBanOptionTwo, blueBanOptionThree);
const mapBanVote = new MapBanVote(redTeamOption, blueTeamOption);

const resetMapBanVoteOptions = () => {
    const setMapBanVote = (team: TeamOption) => {
        mapBanVote.getTeamByTeamName(team.teamName).optionOne.value = suggestedMaps[0];
        mapBanVote.getTeamByTeamName(team.teamName).optionOne.count = 0;
        mapBanVote.getTeamByTeamName(team.teamName).optionTwo.value = suggestedMaps[1];
        mapBanVote.getTeamByTeamName(team.teamName).optionTwo.count = 0;
        mapBanVote.getTeamByTeamName(team.teamName).optionThree.value = suggestedMaps[2];
        mapBanVote.getTeamByTeamName(team.teamName).optionThree.count = 0;
    };

    setMapBanVote(redTeamOption);
    setMapBanVote(blueTeamOption);

    alreadyVotedOnOptionOne = [];
    alreadyVotedOnOptionTwo = [];
    alreadyVotedOnOptionThree = [];

};

const getMapToBePlayed = (redBanOption: BanOption, blueBanOption: BanOption): string => {
    let currentSuggestedMaps: string[] = [...suggestedMaps];
    currentSuggestedMaps.splice(currentSuggestedMaps.indexOf(redBanOption.value), 1);
    const randomMap: string = currentSuggestedMaps[Math.floor(Math.random() * currentSuggestedMaps.length)];
    currentSuggestedMaps.splice(
        currentSuggestedMaps.indexOf(
            redBanOption.value === blueBanOption.value ? randomMap : blueBanOption.value
        ), 1
    );
    return currentSuggestedMaps[0];

};

let i = 1;

const countdownTimer = () => {
    setTimeout(() => {
        updateMapBan(mapBanMsgId, i)
        if (i < timeToBanMap) {
            countdownTimer()
            i++
        } else {
            i = 1;
            setMapToBePlayed(
                getMapToBePlayed(
                    redTeamOption.getHighestVotedOption(),
                    blueTeamOption.getHighestVotedOption(true)
                )
            );
            Finalize(BotActionOption.initialize, mapBanMsgId, mapToBePlayed);
            resetMapBanVoteOptions();
        }
    }, 1000);
};

type MapBanEmbedProps = {
    color: StringResolvable,
    title: StringResolvable,
    optionOneField: EmbedField,
    optionTwoField: EmbedField,
    optionThreeField: EmbedField,
    countdownField: EmbedField
};

const getMapBanEmbedProps = (secondsElapsed: number): MapBanEmbedProps => {
    const secondsRemaining: number = timeToBanMap - secondsElapsed;
    const displaySecondsRemaining: string = secondsRemaining > 0 ? `${secondsRemaining}s` : `${secondsRemaining}`;
    return {
        color: defaultEmbedColor,
        title: "Vote Which Map to Ban",
        optionOneField: {
            name: `${optionOneEmojiName} ${suggestedMaps[0]}`,
            value: `${redTeamOption.optionOne.count}/${blueTeamOption.optionOne.count}`,
            inline: true
        },
        optionTwoField: {
            name: `${optionTwoEmojiName} ${suggestedMaps[1]}`,
            value: `${redTeamOption.optionTwo.count}/${blueTeamOption.optionTwo.count}`,
            inline: true
        },
        optionThreeField: {
            name: `${optionThreeEmojiName} ${suggestedMaps[2]}`,
            value: `${redTeamOption.optionThree.count}/${blueTeamOption.optionThree.count}`,
            inline: true
        },
        countdownField: {
            name: "Timer:",
            value: displaySecondsRemaining,
            inline: true
        }
    };
};

const buildMapBanEmbed = (props: MapBanEmbedProps): MessageEmbed => {
    return new MessageEmbed()
        .setColor(props.color)
        .setTitle(props.title)
        .addFields(props.optionOneField, props.optionTwoField, props.optionThreeField, props.countdownField);
};

const updateMapBan = (msgId: string, secondsElapsed: number) => {
    const getMessage = (): Message => {
        const message = textChannel.messages.cache.get(msgId);
        if (!message) throw Error("The Bot Message was not found. This is a problem.");
        return message;
    }
    if (msgId === mapBanMsgId) {
        getMessage().edit(buildMapBanEmbed(getMapBanEmbedProps(secondsElapsed))).then(m => mapBanMsgId = m.id);
    } else {
        textChannel.send(buildMapBanEmbed(getMapBanEmbedProps(secondsElapsed))).then(m => {
            mapBanMsgId = m.id;
            m.react(optionOneEmojiName).then();
            m.react(optionTwoEmojiName).then();
            m.react(optionThreeEmojiName).then(() => countdownTimer());
        });
    }
};

export const MapBan = (action: BotAction, reaction: MessageReaction, user: User | PartialUser) => {
    const handleReactionAdd = (reaction: MessageReaction, user: User | PartialUser) => {
        if (!reaction || !user) throw Error("Tried to add a Reaction to the Map Ban Embed without a Reaction or a User.")
        const playerIsInThisPug: boolean = !!redTeam.players.find(u => u === user) ||
            !!blueTeam.players.find(u => u === user);

        if (!playerIsInThisPug) {
            return;
        }

        switch (reaction.emoji.name) {
            //TODO: eliminate duplicate code
            case optionOneEmojiName:
                if (
                    !alreadyVotedOnOptionTwo.find(u => u === user) &&
                    !alreadyVotedOnOptionThree.find(u => u === user)
                ) {
                    if (redTeam.players.find(u => u === user)) {
                        redTeamOption.optionOne.count++;
                        alreadyVotedOnOptionOne.push(user);
                    } else if (blueTeam.players.find(u => u === user)) {
                        blueTeamOption.optionOne.count++;
                        alreadyVotedOnOptionOne.push(user);
                    } else {
                        throw Error(
                            "User was not found on either team and should not have been allowed to get this far."
                        )
                    }
                } else {
                    removeReaction(reaction, user);
                }
                break;
            case optionTwoEmojiName:
                if (
                    !alreadyVotedOnOptionOne.find(u => u === user) &&
                    !alreadyVotedOnOptionThree.find(u => u === user)
                ) {
                    if (redTeam.players.find(u => u === user)) {
                        redTeamOption.optionTwo.count++;
                        alreadyVotedOnOptionTwo.push(user);
                    } else if (blueTeam.players.find(u => u === user)) {
                        blueTeamOption.optionTwo.count++;
                        alreadyVotedOnOptionTwo.push(user);
                    } else {
                        throw Error(
                            "User was not found on either team and should not have been allowed to get this far."
                        )
                    }
                } else {
                    removeReaction(reaction, user);
                }
                break;
            case optionThreeEmojiName:
                if (
                    !alreadyVotedOnOptionOne.find(u => u === user) &&
                    !alreadyVotedOnOptionTwo.find(u => u === user)
                ) {
                    if (redTeam.players.find(u => u === user)) {
                        redTeamOption.optionThree.count++;
                        alreadyVotedOnOptionThree.push(user);
                    } else if (blueTeam.players.find(u => u === user)) {
                        blueTeamOption.optionThree.count++;
                        alreadyVotedOnOptionThree.push(user);
                    } else {
                        throw Error(
                            "User was not found on either team and should not have been allowed to get this far."
                        )
                    }
                } else {
                    removeReaction(reaction, user);
                }
                break;
            default:
                removeReaction(reaction, user);
                break;
        }
    };

    const handleReactionRemove = (reaction: MessageReaction, user: User | PartialUser) => {
        switch (reaction.emoji.name) {
            case optionOneEmojiName:
                if (alreadyVotedOnOptionOne.find(u => u === user)) {
                    if (redTeam.players.find(u => u === user)) {
                        redTeamOption.optionOne.count--;
                    } else if (blueTeam.players.find(u => u === user)) {
                        blueTeamOption.optionOne.count--;
                    } else {
                        throw Error(
                            "User was not found on either team and should not have been allowed to get this far."
                        )
                    }
                    alreadyVotedOnOptionOne.splice(alreadyVotedOnOptionOne.indexOf(user));
                }
                break;
            case optionTwoEmojiName:
                if (alreadyVotedOnOptionTwo.find(u => u === user)) {
                    if (redTeam.players.find(u => u === user)) {
                        redTeamOption.optionTwo.count--;
                    } else if (blueTeam.players.find(u => u === user)) {
                        blueTeamOption.optionTwo.count--;
                    } else {
                        throw Error(
                            "User was not found on either team and should not have been allowed to get this far."
                        )
                    }
                    alreadyVotedOnOptionTwo.splice(alreadyVotedOnOptionTwo.indexOf(user));
                }
                break;
            case optionThreeEmojiName:
                if (alreadyVotedOnOptionThree.find(u => u === user)) {
                    if (redTeam.players.find(u => u === user)) {
                        redTeamOption.optionThree.count--;
                    } else if (blueTeam.players.find(u => u === user)) {
                        blueTeamOption.optionThree.count--;
                    } else {
                        throw Error(
                            "User was not found on either team and should not have been allowed to get this far."
                        )
                    }
                    alreadyVotedOnOptionThree.splice(alreadyVotedOnOptionThree.indexOf(user));
                }
                break;
            default:
                break;
        }
    };

    switch (action) {
        case BotActionOption.initialize:
            resetMapBanVoteOptions();
            updateMapBan(tmMsgId, 0);
            break;
        case BotActionOption.reactionAdd:
            handleReactionAdd(reaction, user);
            break;
        case BotActionOption.reactionRemove:
            handleReactionRemove(reaction, user);
            break;
        default:
            break;
    }

};
