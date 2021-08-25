import dotenv from "dotenv";
// import {EmbedAddField} from "./Queue";
dotenv.config();

export type BotAction = BotActionOptions;

export enum BotActionOptions {
    initialize = 0,
    reactionAdd = 1,
    reactionRemove = 2,
    update = 3
}

const getBotToken = (): string => {
    if (process.env.BOT_TOKEN) {
        return process.env.BOT_TOKEN;
    } else {
        throw Error("Error: Your bot token is undefined!");
    }
};
const getBotName = (): string => {
    if (process.env.BOT_NAME) {
        return process.env.BOT_NAME;
    } else {
        throw Error("Error: Your bot name is undefined!");
    }
};
const getMapPool = (): string[] => {
    if (process.env.MAP_POOL) {
        return process.env.MAP_POOL.split(',');
    } else {
        throw Error("Error: Your map pool is undefined!");
    }
};

const getChannelId = (): string => {
    if (process.env.CHANNEL_ID) {
        return process.env.CHANNEL_ID;
    } else {
        throw Error("Error: Your channel ID is undefined!");
    }
};

const getTimeToAlert = (): Date => {
   if (process.env.TIME_TO_ALERT) {
       return new Date(parseInt(process.env.TIME_TO_ALERT));
   } else {
       throw Error("Error: Your time to alert user is undefined!");
   }
}

const getTimeToRespond = (): number => {
    if (process.env.TIME_TO_RESPOND) {
        return parseInt(process.env.TIME_TO_RESPOND);
    } else {
        throw Error("Error: Your time for user to respond to alert is undefined!");
    }
}

const getDefaultValueForEmptyTeam = (): string => {
    if (process.env.DEFAULT_VALUE_FOR_EMPTY_TEAM) {
        return process.env.DEFAULT_VALUE_FOR_EMPTY_TEAM;
    } else {
        throw Error("Error: Your default value for when a team is empty is undefined!");
    }
}

// export type QueueAlertEmbedConstructor = {
//     color: string,
//     title: string,
//     thumbnail: string,
//     alertField: EmbedAddField
// }

export const botToken: string = getBotToken();
export const botName: string = getBotName();
export const mapPool: string[] = getMapPool();
// export const discordId: string | undefined = process.env.DISCORD_ID;
export const channelId: string = getChannelId();
// export const channelFullPath = `https://discord.com/channels/${discordId}/${channelId}`
export const defaultValueForEmptyTeam: string = getDefaultValueForEmptyTeam();
// export const logo = process.env.LOGO;
export const queueEmojiName: string | undefined = "ew_mouse"; /*process.env.QUEUE_EMOJI_NAME*/
// export const queueEmojiId: string | undefined = process.env.QUEUE_EMOJI_ID;
export const queueEmojiIdNum: string = "791235695619473449"; /*process.env.QUEUE_EMOJI_ID_NUM*/
//redTeamEmojiName
//redTeamEmojiId
//redTeamEmojiIdNum
//blueTeamEmojiName
//blueTeamEmojiId
//bueTeamEmojiIdNum
//embedColor TODO: make colors for each embed but give option for all to inherit this color
export const matchSize: number = 10; /*parseInt(process.env.MATCH_SIZE)*/
// export const teamSize = matchSize / 2;
//admins
//resetTeamsEmojiName
//resetTeamsEmojiId
//resetTeamsEmojiIdNum
//resetPugEmojiName
//resetPugEmojiId
//resetPugEmojiIdNum
//optionOneEmojiName
//optionOneEmojiId
//optionOneEmojiIdNum
//optionTwoEmojiName
//optionTwoEmojiId
//optionTwoEmojiIdNum
//optionThreeEmojiName
//optionThreeEmojiId
//optionThreeEmojiIdNum
export const timeToAlert: Date = getTimeToAlert();
export const timeToRespond: number = getTimeToRespond();
