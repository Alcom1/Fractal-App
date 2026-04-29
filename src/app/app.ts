import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MandelbrotFractal } from './scripts/mandelbrot';
import { getPixelArray, IFlag } from './scripts/util';

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

    this.appModelOld = {...this.appModel};

    //Abort all other processes
    this.processAborts.forEach(a => a.value = true);

    //Render canvas
    var canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (canvas.getContext) {
      var ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

      this.renderMandelbrot2(ctx, canvas.width, canvas.height);
    }
  }

  /**
  *   Renders a mandelbrot set on the provided canvas.
  *   @param ctx Canvas rendering context to draw mandelbrot set upon.
  *   @param width Width of canvas
  *   @param height Height of canvas
  *   @returns Promise.
  */
  private async renderMandelbrot2(
    ctx: CanvasRenderingContext2D, 
    width : number, 
    height : number): Promise<void> {

    /** Inverse power of pixel size for the mandelbrot render */
    var power = 6;
    /** Pixel size for the mandelbrot render */
    var pixelSize = Math.floor(width / 2**power);
    /** Index of abort flag for this mandelbrot process. */
    var abortIndex = this.processAborts.push({value : false}) - 1;

    //Stop rendering when pixels are 1x1
    while(pixelSize >= 1) {

      //Pixel steps
      var pixelArray = getPixelArray(width, pixelSize);

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
            (x / width - 0.5) * 2 / this.appModel.zoom - 0.5 - this.appModel.centerX, 
            (y / height - 0.5) * 2 / this.appModel.zoom + this.appModel.centerY,
            100); // 100 * this.appModel.zoom);
          
          /** Shade of pixel based on mandelbrot calculation result */
          var shade = result < 0 ? 12 : Math.max(255 - result / 100 * 255, 0);

          //Stop rendering if abort has been triggered
          if(this.processAborts[abortIndex].value) {
            return;
          }

          //Draw pixel
          ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
          ctx.fillRect(x, y, pixelWidth, pixelHeight);
        }
      }

      //Reduce pixel size by another power.
      power++;
      pixelSize = Math.floor(width / 2**power);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}