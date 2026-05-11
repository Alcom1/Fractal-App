import { MandelbrotFractal } from "./mandelbrot";
import { getPixelArray } from "./util";

/** Request model for mandelbrot worker (Parameters for rendering a mandelbrot set) */
export interface IWorkerEventModel {
  width : number,
  height : number,
  centerX : number,
  centerY : number,
  offsetX : number,
  offsetY : number,
  pixelSize : number,
  zoom: number
}

/** Response model for mandelbrot worker (single pixel size & color of a mandelbrot set render) */
export interface IWorkerResponseModel {
    x1 : number,
    x2 : number,
    y1 : number,
    y2 : number,
    result : number
}

/** Worker */
var wctx: Worker = self as any;

/** Event to trigger for a mandelbrot render */
wctx.addEventListener("message", (event) => {

    var data = event.data as IWorkerEventModel;
    var results = [] as IWorkerResponseModel[];

    //Pixel steps
    var pixelArray = getPixelArray(0, data.width / 2 + 1, data.pixelSize);

    //2D Loop for (x, y) pixel coordinates
    //Vertical loop
    for(var j = 0; j < pixelArray.length - 1; j++) {
        var y = pixelArray[j];
        var pixelHeight = pixelArray[j + 1] - pixelArray[j]

        //Horizontal loop
        for(var i = 0; i < pixelArray.length - 1; i++) {
            var x = pixelArray[i];
            var pixelWidth = pixelArray[i + 1] - pixelArray[i]

            /** Result of mandelbrot calculation */
            var result = MandelbrotFractal(
            ((x + data.offsetX) / data.width - 0.5) * 2 / data.zoom - data.centerX, 
            ((y + data.offsetY) / data.height - 0.5) * 2 / data.zoom + data.centerY,
            100 * ((data.zoom - 1) / 32 + 1));

            /** Add pixel to results */
            results.push({
                x1: x,
                x2: pixelWidth,
                y1: y,
                y2: pixelHeight,
                result: result
            });
        }
    }

    wctx.postMessage(results);
});