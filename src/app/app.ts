import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { hsvToRgb, hsvToRgbString, IFlag } from './scripts/util';
import { IWorkerEventModel, IWorkerResponseModel } from './scripts/mandelbrot_worker';
import { MandelbrotSequence } from './scripts/mandelbrot';

interface IAMMandel {
  centerX : number,
  centerY : number,
  zoom : number
}

interface IAMCursor {
  x : number,
  y : number,
  calcs : {x : number, y : number}[]
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [FormsModule]
})

export class App {
  protected readonly title = signal('fractal-app');

  /** Abort flags for mandelbrot render processes */
  private processAborts: IFlag[] = [];

  /** App model for mandelbrot render */
  public aMMandel : IAMMandel = {
    centerX : 0,
    centerY : 0,
    zoom : 1
  }

  /** App model for mandelbrot render - previous state for comparison */
  private aMMandelOld : IAMMandel = {...this.aMMandel}

  /** */
  public aMCursor : IAMCursor = {
    x: 0,
    y: 0,
    calcs: []
  }

  /** Active web workers for cancellation */
  private workers : Worker[] = [];

  /**
   * App start
   */
  public ngOnInit() {
    this.drawCanvas(true);
  }

  /**
  *   General event for when a slider for the render area has changed.
  */
  public sliderChanged() {
    this.drawCanvas();
  }

  /**
  *   Peform draw on canvas
  */
  public drawCanvas(isSkipModelCheck : boolean = false) {

    //If the model has not changed, do not render
    if (!isSkipModelCheck && JSON.stringify(this.aMMandel) === JSON.stringify(this.aMMandelOld)) {
      return;
    }

    //Terminate workers, store current model data as old.
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    this.aMMandelOld = {...this.aMMandel};

    //Render canvas
    var canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (canvas.getContext) {
      var ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

      /** Inverse power of pixel size for the mandelbrot render */
      var power = 6;

      this.renderMandelbrot(
        ctx, 
        canvas.width, 
        canvas.height,
        power);
    }
  }

  /**
  *   Renders a mandelbrot set on the provided canvas.
  *   @param ctx Canvas rendering context to draw mandelbrot set upon.
  *   @param width Width of canvas
  *   @param height Height of canvas
  *   @returns Promise.
  */
  private renderMandelbrot(
    ctx: CanvasRenderingContext2D, 
    width : number, 
    height : number,
    power : number) {
    
    /** Pixel size for the mandelbrot render */
    var pixelSize = Math.floor(width / 2**power);

    /** Stop if pixels are smaller than 1x1. */
    if (pixelSize < 1) {
      return;
    }

    /** Mandebrot worker */
    var worker = new Worker(new URL("scripts/mandelbrot_worker.ts", import.meta.url))
    this.workers.push(worker);
    worker.postMessage({
      width     : width,
      height    : height,
      centerX   : this.aMMandel.centerX,
      centerY   : this.aMMandel.centerY,
      pixelSize : pixelSize,
      zoom      : this.aMMandel.zoom
    } as IWorkerEventModel);

    /** Draw response from mandelbrot worker */
    worker.onmessage = (event) => {

      /** function to get hsv color from mandelbrot result */
      function resultToHSV(result : number) : [number, number, number] {
        return [
          1 - result / 100,
          Math.min(1, result / 5 - 1),
          result < 0 ? 0 : 1 - result / 100
        ];
      }

      //For individual 1x1 pixels, draw per-pixel
      if(pixelSize == 1) {
        var imageData = new ImageData(width, height);
        var data = imageData.data;

        (event.data as IWorkerResponseModel[]).forEach(r => {

            var index = (r.y1 * width + r.x1) * 4;
            var hue = 1 - r.result / 100;
            var color = hsvToRgb(...resultToHSV(r.result));

            data[index]     = color[0]; //Red
            data[index + 1] = color[1]; //Green
            data[index + 2] = color[2]; //Blue
            data[index + 3] = 255;      //Alpha
        });

        ctx.putImageData(imageData, 0, 0);
      }
      //For large pixels, draw rectangles
      else {
        (event.data as IWorkerResponseModel[]).forEach(r => {
            ctx.fillStyle = hsvToRgbString(...resultToHSV(r.result));
            ctx.fillRect(r.x1, r.y1, r.x2, r.y2);
        });
      }

      //Reduce pixel size and draw again (until pixels are 1x1)
      this.renderMandelbrot(
        ctx,
        width,
        height,
        power + 1)
    };
  }

  /**
  *   Records a mouse event and store a mandelbrot orbit based on its position
  *   @param event The mouseover event
  */
  public MouseMove(event : MouseEvent) : void {
    this.aMCursor.x = event.offsetX;
    this.aMCursor.y = event.offsetY;

    //Translate pixel coordinates to mandelbrot set coordinates for calculation
    var a =   (this.aMCursor.x / 400 - 1) / this.aMMandel.zoom - this.aMMandel.centerX;
    var b = - (this.aMCursor.y / 400 - 1) / this.aMMandel.zoom - this.aMMandel.centerY;

    //Translate mandelbrot set coordinates back to pixel coordinates, offset by 6 to center dots
    this.aMCursor.calcs = MandelbrotSequence(a, b, 50).map(c => ({
      x : ( (this.aMMandel.centerX + c.a) * this.aMMandel.zoom + 1) * 400 - 6, 
      y : (-(this.aMMandel.centerY + c.b) * this.aMMandel.zoom + 1) * 400 - 6
    }));
  }
}