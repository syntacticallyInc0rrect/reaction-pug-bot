//import dotenv for environment variables
import dotenv from "dotenv";
dotenv.config();

const getBotToken = (): string => {
    if (process.env.BOT_TOKEN) {
        return process.env.BOT_TOKEN;
    } else {
        throw Error("Error: Your bot token is undefined!");
    }
};
// const getBotName = (): string => {
//     if (process.env.BOT_NAME) {
//         return process.env.BOT_NAME;
//     } else {
//         throw Error("Error: Your bot name is undefined!");
//     }
// };
const getMapPool = (): string[] => {
    if (process.env.MAP_POOL) {
        return process.env.MAP_POOL.split(',');
    } else {
        throw Error("Error: Your map pool is undefined!");
    }
};

//environment variables
// export const discordId = process.env.DISCORD_ID;
// export const botName: string = getBotName();
// export const channelId = process.env.CHANNEL_ID;
export const botToken: string = getBotToken();
//admins
export const mapPool: string[] = getMapPool();
// export const channelFullPath = `https://discord.com/channels/${discordId}/${channelId}`
//matchSize
//export const teamSize = matchSize / 2;
//logo
//queueEmojiName
//queueEmojiId
//queueEmojiIdNum
//redTeamEmojiName
//redTeamEmojiId
//redTeamEmojiIdNum
//blueTeamEmojiName
//blueTeamEmojiId
//bueTeamEmojiIdNum
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
//embedColor
//defaultValueForEmptyTeam
//timeToAlert
//timeToRespond
