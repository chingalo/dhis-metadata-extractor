export interface Dhis2Indicator {
  name: string;
  shortName: string;
  indicatorType: {
    name: string;
    factor: number;
  };
  numerator: string;
  numeratorDescription: string;
  denominator: string;
  denominatorDescription: string;
  displayDescription?: string;
  id: string;
}
