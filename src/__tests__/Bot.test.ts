import {getChannel, getTextChannel} from "../Bot";
import {VoiceChannel} from "discord.js";

describe("Bot", () => {
    //TODO: close open handles at end of tests so jest can exit properly

    const voiceChannelMock = () => (({} as unknown) as VoiceChannel);
    const voiceChannel: VoiceChannel = voiceChannelMock();

    beforeEach(() => jest.clearAllMocks());
    afterEach(() => jest.clearAllTimers());

    test("get channel throws an error when no channel is found in the client", () => {
        expect(() => {
            getChannel();
        }).toThrowError("Your Client does not have any Channels. This is a problem.");
    });

    test("get text channel throws an error when channel is not a text channel", () => {
        expect(() => {
            getTextChannel(voiceChannel);
        }).toThrowError("Your channel is not a Text Channel. Please correct your Channel ID");
    });


});