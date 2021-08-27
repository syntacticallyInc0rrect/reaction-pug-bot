import {Message, MessageEmbed, MessageReaction, PartialUser, StringResolvable, User} from "discord.js";
import {
    BotAction, BotActionOptions,
    defaultEmbedColor,
    defaultEmbedThumbnailUrl,
    optionOneEmojiName,
    optionThreeEmojiName,
    optionTwoEmojiName,
    teamsEmbedColor,
    teamsEmbedThumbnailUrl,
    teamsEmbedTitle,
    timeToBanMap
} from "./Api";
import {suggestedMaps} from "./Hourglass";
import {EmbedField} from "./Queue";
import {textChannel} from "./Bot";
import {Finalize} from "./Finalize";

export let mapMsgId: string;

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
        const isReverseOrder = reverseOrder ? true : false;
        let highestVotedOption: BanOption = isReverseOrder ? this.optionThree : this.optionOne;
        const optionsArray: BanOption[] = [this.optionOne, this.optionTwo, this.optionThree];
        isReverseOrder && optionsArray.reverse();
        optionsArray.map(o => {(o.count > highestVotedOption.count) ? highestVotedOption = o : () => {}});

        return highestVotedOption;
    };

}

export class MapBanVote {
    public redTeam: TeamOption;
    public blueTeam: TeamOption;

    constructor(redTeam: TeamOption, blueTeam: TeamOption) {
        this.redTeam = redTeam;
        this.blueTeam = blueTeam;
    };

    public getTeamByTeamName = (teamName: string): TeamOption => {
        if (teamName === this.redTeam.teamName) {
            return this.redTeam;
        } else if (teamName === this.blueTeam.teamName) {
            return this.blueTeam;
        } else {
            throw Error(`Team Name: ${teamName}, was not found in MapBanVote Object.`);
        }

    };

}

let banOptionOne = new BanOption();
let banOptionTwo = new BanOption();
let banOptionThree = new BanOption();
let redTeam = new TeamOption("red", banOptionOne, banOptionTwo, banOptionThree);
let blueTeam = new TeamOption("blue", banOptionOne, banOptionTwo, banOptionThree);
let mapBanVote = new MapBanVote(redTeam, blueTeam);

const resetMapBanVoteOptions = () => {
    const setMapBanVote = (team: TeamOption) => {
        mapBanVote.getTeamByTeamName(team.teamName).optionOne.value = suggestedMaps[0];
        mapBanVote.getTeamByTeamName(team.teamName).optionOne.count = 0;
        mapBanVote.getTeamByTeamName(team.teamName).optionTwo.value = suggestedMaps[1];
        mapBanVote.getTeamByTeamName(team.teamName).optionTwo.count = 0;
        mapBanVote.getTeamByTeamName(team.teamName).optionThree.value = suggestedMaps[2];
        mapBanVote.getTeamByTeamName(team.teamName).optionThree.count = 0;
    }
    setMapBanVote(redTeam);
    setMapBanVote(blueTeam);

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

const countdownTimer = () => {
    let i = 0;
    setTimeout(() => {
        i++
        updateMaps(mapMsgId, i)
        if (i < timeToBanMap) {
            countdownTimer();
        } else {
            i = 0;
            Finalize(
                BotActionOptions.initialize,
                mapMsgId,
                getMapToBePlayed(redTeam.getHighestVotedOption(), blueTeam.getHighestVotedOption(true))
            );
            resetMapBanVoteOptions();
        }
    }, 1000);
};

type MapsEmbedProps = {
    color: StringResolvable,
    title: StringResolvable,
    thumbnail: StringResolvable,
    optionOneField: EmbedField,
    optionTwoField: EmbedField,
    optionThreeField: EmbedField,
    countdownField: EmbedField
};

const getMapsEmbedProps = (secondsElapsed: number): MapsEmbedProps => {
    const secondsRemaining: number = timeToBanMap - secondsElapsed;
    const displaySecondsRemaining: string = secondsRemaining > 1 ? `${secondsRemaining}s` : `${secondsRemaining}`;
    return {
        color: teamsEmbedColor ? teamsEmbedColor : defaultEmbedColor,
        title: teamsEmbedTitle,
        thumbnail: teamsEmbedThumbnailUrl ? teamsEmbedThumbnailUrl : defaultEmbedThumbnailUrl,
        optionOneField: {
            name: `${optionOneEmojiName} ${suggestedMaps[0]}`,
            value: `${redTeam.optionOne.count}/${blueTeam.optionOne.count}`,
            inline: true
        },
        optionTwoField: {
            name: `${optionTwoEmojiName} ${suggestedMaps[0]}`,
            value: `${redTeam.optionTwo.count}/${blueTeam.optionTwo.count}`,
            inline: true
        },
        optionThreeField: {
            name: `${optionThreeEmojiName} ${suggestedMaps[0]}`,
            value: `${redTeam.optionThree.count}/${blueTeam.optionThree.count}`,
            inline: true
        },
        countdownField: {
            name: "Timer:",
            value: displaySecondsRemaining,
            inline: true
        }
    };
};

const buildMapsEmbed = (props: MapsEmbedProps): MessageEmbed => {
    return new MessageEmbed()
        .setColor(props.color)
        .setTitle(props.title)
        .setThumbnail(props.thumbnail)
        .addFields(props.optionOneField, props.optionTwoField, props.optionThreeField, props.countdownField);
};

const updateMaps = (msgId: string, secondsElapsed: number) => {
    const getMessage = (): Message => {
        const message = textChannel.messages.cache.get(msgId);
        if (!message) throw Error("The Bot Message was not found. This is a problem.");
        return message;
    }
    getMessage().edit(buildMapsEmbed(getMapsEmbedProps(secondsElapsed))).then(m => mapMsgId = m.id);
};

export const Maps = (action: BotAction, reaction: MessageReaction, user: User | PartialUser) => {
    resetMapBanVoteOptions();
    countdownTimer();
};