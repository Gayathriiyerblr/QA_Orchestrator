/**
 * RandomData.ts — reusable random test-data generators (faker-backed).
 * Used by tests that need unique names/ids/emails (e.g. PIM employee records).
 */
import { faker } from '@faker-js/faker';

export const RandomData = {
  firstName: (): string => faker.person.firstName(),
  lastName: (): string => faker.person.lastName(),
  fullName: (): string => faker.person.fullName(),
  email: (): string => faker.internet.email(),
  username: (): string => faker.internet.username(),
  phone: (): string => faker.phone.number(),
  /** Numeric employee id, unique-ish per call. */
  employeeId: (): string => String(faker.number.int({ min: 1000, max: 99999 })),
  /** Alphanumeric string of the given length. */
  alphanumeric: (length = 8): string => faker.string.alphanumeric(length),
  /** A random word. */
  word: (): string => faker.word.sample(),
} as const;
