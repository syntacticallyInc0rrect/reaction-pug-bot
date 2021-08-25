import {
    Hourglass,
    initializeHourglassForUnitTests,
    mapPool,
    mapsBottom,
    mapsTop,
    suggestedMaps
} from "../Hourglass";

describe("Hourglass", () => {
    const tenMaps: string[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const twoMaps: string[] = ["1", "2"];

    const runFreshHourglass = (mp: string[]) => {
        initializeHourglassForUnitTests(mp);
        Hourglass();
    }

    //TODO: extract these three tests into... well... three tests lol
    test("hourglass transfers 3 maps at a time, suggested maps has 3 maps, suggested maps wipes before 4th push", () => {
        const expected = tenMaps;
        let expectedMapsTopLength = expected.length - 3;
        let expectedMapsBottomLength = 3;
        const expectedSuggestedMapsLength = 3;

        runFreshHourglass(tenMaps);

        const actual = mapPool;
        let actualMapsTopLength = mapsTop.length;
        let actualMapsBottomLength = mapsBottom.length;
        let actualSuggestedMapsLength = suggestedMaps.length;

        expect(actual).toEqual(expected);
        expect(actualMapsTopLength).toEqual(expectedMapsTopLength);
        expect(actualMapsBottomLength).toEqual(expectedMapsBottomLength);
        expect(actualSuggestedMapsLength).toEqual(expectedSuggestedMapsLength);

        Hourglass();

        expectedMapsTopLength = expected.length - 6;
        expectedMapsBottomLength = 6;
        actualMapsTopLength = mapsTop.length;
        actualMapsBottomLength = mapsBottom.length;
        actualSuggestedMapsLength = suggestedMaps.length;

        expect(actualMapsTopLength).toEqual(expectedMapsTopLength);
        expect(actualMapsBottomLength).toEqual(expectedMapsBottomLength);
        expect(actualSuggestedMapsLength).toEqual(expectedSuggestedMapsLength);
    });

    test("hourglass throws an error when there are less than three maps in the map pool", () => {
        const errorMessage: string = "Error: Map Pool must contain at least 3 Maps!";
        expect(() => runFreshHourglass(twoMaps)).toThrowError(errorMessage);
    })

    test("maps get transferred to other side if less than 3 remain", () => {
        runFreshHourglass(tenMaps);
        expect(mapsTop.length).toEqual(7);
        expect(mapsBottom.length).toEqual(3);

        Hourglass();
        expect(mapsTop.length).toEqual(4);
        expect(mapsBottom.length).toEqual(6);

        Hourglass();
        expect(mapsTop.length).toEqual(1);
        expect(mapsBottom.length).toEqual(9);

        Hourglass();
        expect(mapsTop.length).toEqual(3);
        expect(mapsBottom.length).toEqual(7);

        Hourglass();
        expect(mapsTop.length).toEqual(6);
        expect(mapsBottom.length).toEqual(4);

        Hourglass();
        expect(mapsTop.length).toEqual(9);
        expect(mapsBottom.length).toEqual(1);

        Hourglass();
        expect(mapsTop.length).toEqual(7);
        expect(mapsBottom.length).toEqual(3);
    })

});