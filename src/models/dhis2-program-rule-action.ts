export interface Dhis2ProgramRuleAction {
  programRule: {
    name: string;
  };
  programRuleActionType: string;
  dataElement?: { displayName: string; displayFormName: string };
  id: string;
  optionGroup?: {
    name: string;
  };
  trackedEntityAttribute?: { displayName: string; displayFormName: string };
  programStageSection?: {
    name: string;
  };
  programStage?: { name: string };
  data?: string;
  content?: string;
  location?: string;
}
