import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { hsvToRgb, IFlag } from './scripts/util';
import { IWorkerEventModel, IWorkerResponseModel } from './scripts/mandelbrot_worker';

interface IAppModel {
  centerX : number,
  centerY : number,
  zoom : number
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

  /** App model */
  public appModel : IAppModel = {
    centerX : 0,
    centerY : 0,
    zoom : 1
  }

  /** App model - previous state for comparison */
  private appModelOld : IAppModel = {...this.appModel}

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
    if (!isSkipModelCheck && JSON.stringify(this.appModel) === JSON.stringify(this.appModelOld)) {
      return;
    }

    //Terminate workers, store current model data as old.
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    this.appModelOld = {...this.appModel};

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
      centerX   : this.appModel.centerX,
      centerY   : this.appModel.centerY,
      pixelSize : pixelSize,
      zoom      : this.appModel.zoom
    } as IWorkerEventModel);

    worker.onmessage = (event) => {
      (event.data as IWorkerResponseModel[]).forEach(r => {

          var hue = 1 / 10 + r.result / 50;

          ctx.fillStyle = hsvToRgb(
            hue, 
            1 - r.result / 500,
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
}