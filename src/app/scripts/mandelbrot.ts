import Complex from "./complex";

/**
*   Peforms a mandelbrot set calculation for a specific (x,y) coordinate.
*   @param x Real component or horizontal coordinate of complex number
*   @param y Imaginary component or vertical coordinate of complex number
*   @param iterations Maximum number of mandelbrot set calculations
*/
export function MandelbrotFractal(x : number, y : number, iterations: number = 100) : number {

    var c = new Complex(x, y);
    var zInit = Complex.zero;
    var i = 0;

    //Inside main cardioid
    if((8 * c.absSquared - 1.5)**2 + 8 * x < 3) {
        return -1;
    }

    //Recursively calculate mandlebrot until the value is OOB or out of iterations.
    function mandelbrotRecurse(z : Complex) : number {

        //OOB
        if(z.absSquared > 4) {
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

/**
*   Records the results of a mandelbrot set calculation for a specific (x,y) coordinate.
*   @param x Real component or horizontal coordinate of complex number
*   @param y Imaginary component or vertical coordinate of complex number
*   @param iterations Number of mandelbrot set calculations
*/
export function MandelbrotSequence(x : number, y : number, iterations: number = 10) : Complex[] {

    var c = new Complex(x, y);
    var z = Complex.zero;
    var result = [];
    
    //Mandelbrot set calculation loop
    for(var i = 0; i < iterations; i++) {
        z = z.square.getAdd(c);

        if(Math.abs(z.a) > 2 || Math.abs(z.b) > 2) {
            return result;
        }

        result.push(z.get);
    }

    return result;
}