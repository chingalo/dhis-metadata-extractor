export interface Dhis2ProgramIndicator {
  name: string;
  description: string;
  expression: string;
  filter: string;
  analyticsType: string;
  id: string;
  programIndicatorGroups: Array<{ name: string }>;
}
