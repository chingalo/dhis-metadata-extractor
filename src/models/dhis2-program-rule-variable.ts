export interface Dhis2ProgramRuleVariable {
  name: string;
  program: {
    id: string;
  };
  dataElement?: {
    displayName: string;
    displayFormName: string;
  };
  trackedEntityAttribute?: {
    displayName: string;
    displayFormName: string;
  };
}
