export interface Dhis2ProgramRule {
  name: string;
  program: {
    name: string;
    id: string;
  };
  condition: string;
  id: string;
  description?: string;
}
