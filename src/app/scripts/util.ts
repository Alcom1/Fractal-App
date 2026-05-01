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

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * also https://stackoverflow.com/questions/51203917/math-behind-hsv-to-rgb-conversion-of-colors
 * Assumes h, s, and v are contained in the set [0, 1]
 * returns rgb color string
 *
 * @param   number  h   The hue
 * @param   number  s   The saturation
 * @param   number  v   The value
 * @return  string      The RGB representation
 */
export function hsvToRgb(h : number, s : number, v : number) : string {
    var r = 0, g = 0, b = 0;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return `rgb(${
        Math.floor(r * 255)},${
        Math.floor(g * 255)},${
        Math.floor(b * 255)})`;
}