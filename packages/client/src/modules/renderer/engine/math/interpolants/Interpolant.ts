import { createTypedArrayAs, TypedArray } from '../MathUtils.js';

export abstract class Interpolant<T extends TypedArray = any, V extends TypedArray = any> {
  _activeIndex: number = 0;

  protected constructor(
    public parameterPositions: T,
    public sampleValues: V,
    public valueSize: number,
    public resultBuffer: V = createTypedArrayAs(sampleValues, valueSize),
  ) {}

  interpolateAt(at: number): V {
    const samplePoints = this.parameterPositions;
    let currentIndex = this._activeIndex;
    let currentPoint = samplePoints[currentIndex];
    let previousPoint = samplePoints[currentIndex - 1];

    validate_interval: {
      seek: {
        let upperBound: number;

        linear_scan: {
          forward_scan: if (!(at < currentPoint)) {
            for (let maxSearchIndex = currentIndex + 2; ; ) {
              if (currentPoint === undefined) {
                if (at < previousPoint) break forward_scan;

                currentIndex = samplePoints.length;
                this._activeIndex = currentIndex;
                return this.copySampleValue(currentIndex - 1);
              }

              if (currentIndex === maxSearchIndex) break;
              previousPoint = currentPoint;
              currentPoint = samplePoints[++currentIndex];

              if (at < currentPoint) break seek;
            }

            upperBound = samplePoints.length;
            break linear_scan;
          }
          if (!(at >= previousPoint)) {
            const t1global = samplePoints[1];

            if (at < t1global) {
              currentIndex = 2;
              previousPoint = t1global;
            }

            for (let giveUpAt = currentIndex - 2; ; ) {
              if (previousPoint === undefined) {
                this._activeIndex = 0;
                return this.copySampleValue(0);
              }

              if (currentIndex === giveUpAt) break;

              currentPoint = previousPoint;
              previousPoint = samplePoints[--currentIndex - 1];

              if (at >= previousPoint) break seek;
            }

            upperBound = currentIndex;
            currentIndex = 0;
            break linear_scan;
          }

          break validate_interval;
        }

        while (currentIndex < upperBound) {
          const midIndex = (currentIndex + upperBound) >>> 1;

          if (at < samplePoints[midIndex]) {
            upperBound = midIndex;
          } else {
            currentIndex = midIndex + 1;
          }
        }

        currentPoint = samplePoints[currentIndex];
        previousPoint = samplePoints[currentIndex - 1];

        if (previousPoint === undefined) {
          this._activeIndex = 0;
          return this.copySampleValue(0);
        }

        if (currentPoint === undefined) {
          currentIndex = samplePoints.length;
          this._activeIndex = currentIndex;
          return this.copySampleValue(currentIndex - 1);
        }
      }

      this._activeIndex = currentIndex;

      this.onIntervalChange?.(currentIndex, previousPoint, currentPoint);
    }

    return this.interpolate(currentIndex, previousPoint, at, currentPoint);
  }

  copySampleValue(index: number): V {
    const { resultBuffer, sampleValues, valueSize } = this;
    const offset = index * valueSize;

    for (let i = 0; i !== valueSize; ++i) resultBuffer[i] = sampleValues[offset + i];

    return resultBuffer;
  }

  abstract interpolate(currentIndex: number, previousPoint: number, at: number, currentPoint: number): V;

  onIntervalChange?(currentIndex: number, previousPoint: number, currentPoint: number): void;
}
