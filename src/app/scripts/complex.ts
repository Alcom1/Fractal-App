// Complex number interface
interface IComplex {
    a: number;  //Real component
    b: number;  //Imaginary component
}

// Complex number class
export default class Complex implements IComplex {

    // Complex number constructor
    constructor(public a: number, public b: number) {}

    // Returns a complex number with real and imaginary components that are 0
    public static get zero() : Complex {
        return new Complex(0, 0);
    }

    // Returns the square of this complex number
    public get square() : Complex {
        return this.getMult(this);
    }

    // Returns the absolute value of this complex number
    public get abs() : number {
        return Math.sqrt(this.absSquared);
    }

    // Returns the squared absolute value of this complex number
    public get absSquared() : number {
        return this.a**2 + this.b**2
    }

    // Returns this complex number added to another
    public getAdd(other: IComplex) : Complex {
        return new Complex(this.a + other.a, this.b + other.b);
    }

    // Returns this complex number multiplied by another
    public getMult(other: IComplex) : Complex {
        return new Complex(
            this.a * other.a - this.b * other.b, 
            this.a * other.b + this.b * other.a)
    }
}