/**
 * Mirrors backend AuthService.programmeForSpecialisation / facultyForSpecialisation /
 * expectedGraduationFor. Kept as a single static map so the register page can show
 * the same derived programme + faculty + expected-graduation that the backend will
 * persist on submit. Update both sides if the catalogue changes.
 */

export interface ProgrammeMapping {
  programme: string
  faculty: string
}

export const SPECIALISATION_TO_PROGRAMME: Record<string, ProgrammeMapping> = {
  'Software Engineering': {
    programme: 'Bachelor of Computer Science (Hons.)',
    faculty: 'FCI',
  },
  'Data Science': {
    programme: 'Bachelor of Computer Science (Hons.)',
    faculty: 'FCI',
  },
  Cybersecurity: {
    programme: 'Bachelor of Computer Science (Hons.)',
    faculty: 'FCI',
  },
  'Game Development': {
    programme: 'Bachelor of Computer Science (Hons.)',
    faculty: 'FCI',
  },
  'Information Systems': {
    programme: 'Bachelor of Information Technology (Honours)',
    faculty: 'FCI',
  },
}

export function programmeForSpecialisation(
  specialisation: string | undefined | null
): ProgrammeMapping | undefined {
  if (!specialisation) return undefined
  return SPECIALISATION_TO_PROGRAMME[specialisation.trim()]
}

export function expectedGraduationYear(
  intakeYear: number | undefined | null
): number | undefined {
  if (intakeYear == null || Number.isNaN(intakeYear)) return undefined
  return intakeYear + 3
}
