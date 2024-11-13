import { Dhis2ProgramRuleVariable } from '../models';

export const PROGRAM_RULE_VARIABLES_REFERENCE: Dhis2ProgramRuleVariable[] = [
  {
    name: 'current_date',
    dataElement: {
      displayName: 'Current Date',
      displayFormName: 'Current Date'
    },
    program: { id: '' }
  },
  {
    name: 'event_date',
    dataElement: {
      displayName: 'Event Date',
      displayFormName: 'Event Date'
    },
    program: { id: '' }
  }
];
