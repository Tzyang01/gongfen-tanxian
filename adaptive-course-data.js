import { UNIT1_ADAPTIVE } from './adaptive/unit-1.js';
import { UNIT2_ADAPTIVE } from './adaptive/unit-2.js';
import { UNIT3_ADAPTIVE } from './adaptive/unit-3.js';
import { UNIT4_ADAPTIVE } from './unit4-adaptive-data.js';
import { UNIT5_ADAPTIVE } from './adaptive/unit-5.js';
import { UNIT6_ADAPTIVE } from './adaptive/unit-6.js';
import { UNIT7_ADAPTIVE } from './adaptive/unit-7.js';
import { UNIT8_ADAPTIVE } from './adaptive/unit-8.js';
import { UNIT9_ADAPTIVE } from './adaptive/unit-9.js';
import { UNIT10_ADAPTIVE } from './adaptive/unit-10.js';

const units = [
  UNIT1_ADAPTIVE,
  UNIT2_ADAPTIVE,
  UNIT3_ADAPTIVE,
  UNIT4_ADAPTIVE,
  UNIT5_ADAPTIVE,
  UNIT6_ADAPTIVE,
  UNIT7_ADAPTIVE,
  UNIT8_ADAPTIVE,
  UNIT9_ADAPTIVE,
  UNIT10_ADAPTIVE,
];

export const ADAPTIVE_COURSE = {
  units,
  skillIds: units.flatMap((unit) => unit.skills.map((skill) => skill.id)),
};

export const getAdaptiveUnit = (unitId) => units.find((unit) => unit.unitId === unitId) || null;

