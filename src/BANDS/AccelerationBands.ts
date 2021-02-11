import {SMA} from '../SMA/SMA';
import {EMA} from '../EMA/EMA';
import Big, {BigSource} from 'big.js';
import {NotEnoughDataError} from '../error';
import {BandsResult} from './BandsResult';
import {Indicator} from '../Indicator';

export class AccelerationBands implements Indicator {
  private readonly lowerBand: EMA | SMA;
  private readonly middleBand: EMA | SMA;
  private readonly upperBand: EMA | SMA;

  /**
   * Acceleration Bands
   *
   * @param interval The interval that is being used for the three moving averages which create lower, middle and upper
   *   bands
   * @param width A coefficient specifying the distance between the middle band and upper/lower bands
   * @param Indicator Which average (SMA, EMA) to use
   *
   * @see https://www.tradingtechnologies.com/xtrader-help/x-study/technical-indicator-definitions/acceleration-bands-abands/
   * @see https://www.motivewave.com/studies/acceleration_bands.htm
   * @see https://github.com/QuantConnect/Lean/blob/master/Indicators/AccelerationBands.cs
   * @see https://github.com/twopirllc/pandas-ta/blob/master/pandas_ta/volatility/accbands.py
   */
  constructor(
    public readonly interval: number,
    public readonly width: number,
    Indicator: typeof EMA | typeof SMA = SMA
  ) {
    this.lowerBand = new Indicator(interval);
    this.middleBand = new Indicator(interval);
    this.upperBand = new Indicator(interval);
  }

  get isStable(): boolean {
    try {
      this.middleBand.getResult();
      return true;
    } catch (error) {
      return false;
    }
  }

  update(high: BigSource, low: BigSource, close: BigSource): void {
    const coefficient = new Big(high).minus(low).div(new Big(high).plus(low)).mul(this.width);

    // (Low * (1 - 4 * (High - Low)/ (High + Low)))
    this.lowerBand.update(new Big(low).mul(new Big(1).minus(coefficient)));
    // (Close)
    this.middleBand.update(close);
    // (High * ( 1 + 4 * (High - Low) / (High + Low)))
    this.upperBand.update(new Big(high).mul(new Big(1).plus(coefficient)));
  }

  getResult(): BandsResult {
    if (!this.isStable) {
      throw new NotEnoughDataError();
    }

    return {
      lower: this.lowerBand.getResult(),
      middle: this.middleBand.getResult(),
      upper: this.upperBand.getResult(),
    };
  }
}
