import {Hourglass, initializeHourglassForUnitTests, mapPool, mapsBottom, mapsTop, suggestedMaps} from "../Hourglass";

describe("Hourglass", () => {
    const tenMaps: string[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const twoMaps: string[] = ["1", "2"];

    const runFreshHourglass = (mp: string[]) => {
        initializeHourglassForUnitTests(mp);
        Hourglass();
    };

    describe("hourglass transfers maps back and forth", () => {
        const expectedSuggestedMapsLength = 3;

        test("hourglass transfers 3 maps at a time", () => {
            const expected = tenMaps;
            const expectedMapsTopLength = expected.length - 3;
            const expectedMapsBottomLength = 3;

            runFreshHourglass(tenMaps);

            const actual = mapPool;
            const actualMapsTopLength = mapsTop.length;
            const actualMapsBottomLength = mapsBottom.length;
            const actualSuggestedMapsLength = suggestedMaps.length;

            expect(actual).toEqual(expected);
            expect(actualMapsTopLength).toEqual(expectedMapsTopLength);
            expect(actualMapsBottomLength).toEqual(expectedMapsBottomLength);
            expect(actualSuggestedMapsLength).toEqual(expectedSuggestedMapsLength);

        });

        test("suggested maps always has 3 maps and wipes before 4th map is added", () => {
            const expected = tenMaps;
            const expectedMapsTopLength = expected.length - 6;
            const expectedMapsBottomLength = 6;

            Hourglass();

            const actualMapsTopLength = mapsTop.length;
            const actualMapsBottomLength = mapsBottom.length;
            const actualSuggestedMapsLength = suggestedMaps.length;

            expect(actualMapsTopLength).toEqual(expectedMapsTopLength);
            expect(actualMapsBottomLength).toEqual(expectedMapsBottomLength);
            expect(actualSuggestedMapsLength).toEqual(expectedSuggestedMapsLength);
        });
    });


    test("hourglass throws an error when there are less than three maps in the map pool", () => {
        const errorMessage: string = "Map Pool must contain at least 3 Maps!";
        expect(() => runFreshHourglass(twoMaps)).toThrowError(errorMessage);
    });

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
    });

});