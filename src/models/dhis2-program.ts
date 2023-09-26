import { Dhis2OptionSet } from './dhis2-option-set';

export interface Dhis2Program {
  id: string;
  name: string;
  programType: string;
  trackedEntityType: Dhis2TrackedEntityType;
  programSections?: Dhis2ProgramSection[];
  programTrackedEntityAttributes: Array<{
    trackedEntityAttribute: Dhis2TrackedEntityAttribute;
  }>;
  programStages: Dhis2ProgramStage[];
}

export interface Dhis2TrackedEntityType {
  id: string;
  name: string;
}

export interface Dhis2ProgramSection {
  id: string;
  name: string;
  sortOrder: string;
  trackedEntityAttributes: Dhis2TrackedEntityAttribute[];
}

export interface Dhis2ProgramTrackedEntityAttribute {
  trackedEntityAttribute: Dhis2TrackedEntityAttribute;
}

export interface Dhis2TrackedEntityAttribute {
  id: string;
  name: string;
  code: string;
  shortName: string;
  formName?: string;
  description?: string;
  valueType: string;
  aggregationType: string;
  displayInListNoProgram: string;
  pattern: string;
  optionSet?: Dhis2OptionSet;
}

export interface Dhis2ProgramStage {
  id: string;
  name: string;
  programStageDataElements: Array<{
    dataElement: Dhis2DataElement;
  }>;
  programStageSections: Dhis2ProgramStageSection[];
}

export interface Dhis2ProgramStageSection {
  id: string;
  name: string;
  dataElements: Dhis2DataElement[];
}

export interface Dhis2DataElement {
  id: string;
  name: string;
  code: string;
  shortName: string;
  formName?: string;
  description?: string;
  valueType: string;
  aggregationType: string;
  domainType: string;
  zeroIsSignificant: string;
  optionSet?: Dhis2OptionSet;
}
