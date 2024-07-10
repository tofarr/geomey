import { NUMBER_FORMAT } from "./NumberFormatter"


class SVGPathWalker implements PathWalker {
    private path: string[]
    private numberFormat: (n: number) => string

    constructor(numberFormat?: (n: number) => string) {
        this.path = []
        this.numberFormat = numberFormat || NUMBER_FORMAT
    }

    moveTo(x: number, y: number): void {
        const { numberFormat } = this
        this.path.push("M", numberFormat(x), " ", numberFormat(y))
    }

    lineTo(x: number, y: number): void {
        const { numberFormat } = this
        this.path.push("L", numberFormat(x), " ", numberFormat(y))
    }

    bezierCurveTo(
        controlPoint1X: number,
        controlPoint1Y: number,
        controlPoint2X: number, 
        controlPoint2Y: number,
        x: number,
        y: number
    ): void {
        const { numberFormat } = this
        this.path.push(
            "C", 
            numberFormat(controlPoint1X),
            " ",
            numberFormat(controlPoint1Y),
            ", ",
            numberFormat(controlPoint2X),
            " ",
            numberFormat(controlPoint2Y),
            ", ",
            numberFormat(x),
            " ",
            numberFormat(y)
        )
    }

    closePath(): void {
        this.path.push("Z")
    }

    toPath(): string {
        return this.path.join("")
    }
}