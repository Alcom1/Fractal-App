export interface IFlag {
    value : boolean;
}
/**
*   Utility function for generating crisp integer-sized pixels based on the width-space occupied and size of the pixels.
*   @param width Width of the space occupied by the pixels.
*   @param size Average width and height of the pixels.
*   @returns a 1D array representing the coordinate steps of each pixel.
*/
export function getPixelArray(width: number, size: number) : number[] {
    var i = 0;
    var result: number[] = [];

    while (i < width && i >= 0) {
        result.push(i);

        i = Math.floor(i + size);
    }

    return result;
}