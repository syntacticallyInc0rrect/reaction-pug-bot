import dotenv from "dotenv";
import {channelId, discordId} from "./Bot";
import {PartialUser, User} from "discord.js";

dotenv.config();

export type ActivePug = {
    id: bigint,
    redTeamChannelId: string,
    blueTeamChannelId: string,
    messageId: string,
    redTeamPlayers: (User | PartialUser)[],
    blueTeamPlayers: (User | PartialUser)[]
}

export type BotAction = BotActionOption;

export enum BotActionOption {
    initialize = 0,
    reactionAdd = 1,
    reactionRemove = 2,
    update = 3
}

export enum TeamNameOption {
    red = 0,
    blue = 1
}

export enum MapPickOption {
    random = 0,
    vote = 1,
    ban = 2
}

export const getTeamName = (whichTeam: TeamNameOption): string => {
    if (whichTeam === TeamNameOption.red) {
        return redTeamName;
    } else if (whichTeam === TeamNameOption.blue) {
        return blueTeamName;
    } else {
        throw Error("Unable to find team name that was outside the scope of these two teams.");
    }
};

const getBotToken = (): string => {
    if (process.env.BOT_TOKEN) {
        return process.env.BOT_TOKEN;
    } else {
        throw Error("Your bot token is undefined!");
    }
};

const getMapPool = (): string[] => {
    if (process.env.MAP_POOL) {
        return process.env.MAP_POOL.split(',');
    } else {
        throw Error("Your map pool is undefined!");
    }
};

//TODO: handle all configurable variables this way so they can be redefined while bot is running
const getRedTeamName = (): string => process.env.RED_TEAM_NAME ? process.env.RED_TEAM_NAME : "Red Team";
const getBlueTeamName = (): string => process.env.BLUE_TEAM_NAME ? process.env.BLUE_TEAM_NAME : "Blue Team";

export const botToken: string = getBotToken();

export const mapPool: string[] = getMapPool();
export let mapPickOption: MapPickOption = MapPickOption.random;

export const getChannelFullPath = (): string => `https://discord.com/channels/${discordId}/${channelId}`
export const defaultValueForEmptyTeam: string = process.env.DEFAULT_VALUE_FOR_EMPTY_TEAM ? process.env.DEFAULT_VALUE_FOR_EMPTY_TEAM : "waiting on first player";

export const queueEmojiName: string = process.env.QUEUE_EMOJI_NAME ? process.env.QUEUE_EMOJI_NAME : "🎮";
export const queueEmojiId: string = process.env.QUEUE_EMOJI_ID ? process.env.QUEUE_EMOJI_ID : "";
export const queueEmojiIdNum: string = process.env.QUEUE_EMOJI_ID_NUM ? process.env.QUEUE_EMOJI_ID_NUM : "";

export const redTeamName: string = getRedTeamName();
export const redTeamEmojiName: string = process.env.RED_TEAM_EMOJI_NAME ? process.env.RED_TEAM_EMOJI_NAME : "🟥";
export const redTeamEmojiId: string = process.env.RED_TEAM_EMOJI_ID ? process.env.RED_TEAM_EMOJI_ID : "";
export const redTeamEmojiIdNum: string = process.env.RED_TEAM_EMOJI_ID_NUM ? process.env.RED_TEAM_EMOJI_ID_NUM : "";
export const blueTeamName: string = getBlueTeamName();
export const blueTeamEmojiName: string = process.env.BLUE_TEAM_EMOJI_NAME ? process.env.BLUE_TEAM_EMOJI_NAME : "🟦";
export const blueTeamEmojiId: string = process.env.BLUE_TEAM_EMOJI_ID ? process.env.BLUE_TEAM_EMOJI_ID : "";
export const blueTeamEmojiIdNum: string = process.env.BLUE_TEAM_EMOJI_ID_NUM ? process.env.BLUE_TEAM_EMOJI_ID_NUM : "";

export const defaultEmbedColor: string = process.env.DEFAULT_EMBED_COLOR ? process.env.DEFAULT_EMBED_COLOR : "#ff0000";

export const defaultEmbedThumbnailUrl: string = process.env.DEFAULT_EMBED_THUMBNAIL_URL ? process.env.DEFAULT_EMBED_THUMBNAIL_URL : "https://www.example.com";
export const queueEmbedThumbnailUrl: string | undefined = process.env.QUEUE_EMBED_THUMBNAIL_URL;
export const teamsEmbedThumbnailUrl: string | undefined = process.env.TEAMS_EMBED_THUMBNAIL_URL;
export const mapsEmbedThumbnailUrl: string | undefined = process.env.MAPS_EMBED_THUMBNAIL_URL;
export const finalEmbedThumbnailUrl: string | undefined = process.env.FINAL_EMBED_THUMBNAIL_URL;
export const alertEmbedThumbnailUrl: string | undefined = process.env.FINAL_EMBED_THUMBNAIL_URL;
export const directMessageThumbnailUrl: string | undefined = process.env.TEAMS_EMBED_THUMBNAIL_URL;

export const queueEmbedTitle: string = process.env.QUEUE_EMBED_TITLE ? process.env.QUEUE_EMBED_TITLE : "Reaction Based PUG Bot";

export const teamsEmbedTitle: string = process.env.TEAMS_EMBED_TITLE ? process.env.TEAMS_EMBED_TITLE : "Choose Your Side";

export const directMessageTitle: string = process.env.DIRECT_MESSAGE_TITLE ? process.env.DIRECT_MESSAGE_TITLE : "Hey!";
export const directMessageName: string = process.env.DIRECT_MESSAGE_NAME ? process.env.DIRECT_MESSAGE_NAME : "Your PUG is Ready!";

export const matchSize: number = process.env.MATCH_SIZE ? parseInt(process.env.MATCH_SIZE) : 10;
export const teamSize: number = matchSize / 2;

export const admins: string[] | undefined = process.env.ADMINS ? process.env.ADMINS.split(',') : undefined;

export const resetTeamsEmojiName: string = process.env.RESET_TEAMS_EMOJI_NAME ? process.env.RESET_TEAMS_EMOJI_NAME : "♻️";
export const resetTeamsEmojiId: string = process.env.RESET_TEAMS_EMOJI_NAME ? process.env.RESET_TEAMS_EMOJI_NAME : "";
export const resetTeamsEmojiIdNum: string = process.env.RESET_TEAMS_EMOJI_NAME ? process.env.RESET_TEAMS_EMOJI_NAME : "";
export const resetPugEmojiName: string = process.env.RESET_PUG_EMOJI_NAME ? process.env.RESET_PUG_EMOJI_NAME : "⏮️";
export const finishPugEmojiName: string = "🏁";
export const resetPugEmojiId: string = process.env.RESET_PUT_EMOJI_ID ? process.env.RESET_PUT_EMOJI_ID : "";
export const resetPugEmojiIdNum: string = process.env.RESET_PUG_EMOJI_ID_NUM ? process.env.RESET_PUG_EMOJI_ID_NUM : "";

export const optionOneEmojiName: string = process.env.OPTION_ONE_EMOJI_NAME ? process.env.OPTION_ONE_EMOJI_NAME : "1️⃣";
export const optionOneEmojiId: string = process.env.OPTION_ONE_EMOJI_ID ? process.env.OPTION_ONE_EMOJI_ID : "";
export const optionOneEmojiIdNum: string = process.env.OPTION_ONE_EMOJI_ID_NUM ? process.env.OPTION_ONE_EMOJI_ID_NUM : "";

export const optionTwoEmojiName: string = process.env.OPTION_TWO_EMOJI_NAME ? process.env.OPTION_TWO_EMOJI_NAME : "2️⃣";
export const optionTwoEmojiId: string = process.env.OPTION_TWO_EMOJI_ID ? process.env.OPTION_TWO_EMOJI_ID : "";
export const optionTwoEmojiIdNum: string = process.env.OPTION_TWO_EMOJI_ID_NUM ? process.env.OPTION_TWO_EMOJI_ID_NUM : "";

export const optionThreeEmojiName: string = process.env.OPTION_THREE_EMOJI_NAME ? process.env.OPTION_THREE_EMOJI_NAME : "3️⃣";
export const optionThreeEmojiId: string = process.env.OPTION_THREE_EMOJI_ID ? process.env.OPTION_THREE_EMOJI_ID : "";
export const optionThreeEmojiIdNum: string = process.env.OPTION_THREE_EMOJI_ID_NUM ? process.env.OPTION_THREE_EMOJI_ID_NUM : "";

export const timeToBanMap: number = process.env.TIME_TO_BAN_MAP ? parseInt(process.env.TIME_TO_BAN_MAP) : 30;
export const timeToAlert: Date = process.env.TIME_TO_ALERT ? new Date(parseInt(process.env.TIME_TO_ALERT)) : new Date(720000);
export const timeToRespond: number = process.env.TIME_TO_RESPOND ? parseInt(process.env.TIME_TO_RESPOND) : 90000;
