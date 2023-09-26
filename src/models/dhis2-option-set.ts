export interface Dhis2OptionSet {
  id: string;
  name: string;
  code?: string;
  valueType?: string;
  options?: Dhis2Option[];
}

export interface Dhis2Option {
  id: string;
  name: string;
  code: string;
}
