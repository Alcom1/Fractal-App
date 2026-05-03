import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { hsvToRgb, IFlag } from './scripts/util';
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

      this.renderMandelbrot2(
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
  private renderMandelbrot2(
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

    worker.onmessage = (event) => {
      (event.data as IWorkerResponseModel[]).forEach(r => {

          var hue = 1 - r.result / 100;

          ctx.fillStyle = hsvToRgb(
            hue, 
            Math.min(1, r.result / 5 - 1),
            r.result < 0 ? 0 : 1 - r.result / 100);
          ctx.fillRect(r.x1, r.y1, r.x2, r.y2);
      });

      this.renderMandelbrot2(
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

    console.log(this.aMCursor.x, this.aMCursor.y);

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