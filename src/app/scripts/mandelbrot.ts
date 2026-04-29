import Complex from "./complex";

/**
*   Peforms a mandelbrot set calculation for a specific (x,y) coordinate.
*   @param x Real component or horizontal coordinate of complex number
*   @param y Imaginary component or vertical coordinate of complex number
*   @param iterations Maximum number of mandelbrot
*/
export function MandelbrotFractal(x : number, y : number, iterations: number = 100) : number {

    var c = new Complex(x, y);
    var zInit = Complex.zero;
    var i = 0;

    //Recursively calculate mandlebrot until the value is OOB or out of iterations.
    function mandelbrotRecurse(z : Complex) : number {

        //OOB
        if(z.abs > 2) {
            return i;
        }
        //Maximum iterations reached
        if(i >= iterations) {
            return -1;
        }

        i++;

        //Iterate z^2 + c
        return mandelbrotRecurse(z.square.getAdd(c));
    }

    return mandelbrotRecurse(zInit);
}