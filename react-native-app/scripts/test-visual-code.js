import { customAlphabet } from "jsr:@sitnik/nanoid";

// Visual Code utilities test
const VisualCode = {
  // Characters allowed in the code (excluding checksum position)
  ALLOWED_CHARS: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",

  // Generate a checksum for a code
  generateChecksum: (prefix, digits) => {
    // Simple checksum algorithm: sum of character positions in ALLOWED_CHARS modulo ALLOWED_CHARS length
    const combined = prefix + digits;
    let sum = 0;

    for (let i = 0; i < combined.length; i++) {
      const char = combined[i];
      const pos = VisualCode.ALLOWED_CHARS.indexOf(char);
      if (pos >= 0) {
        sum += pos * (i + 1); // Weight by position
      }
    }

    // Get the checksum character
    return VisualCode.ALLOWED_CHARS[sum % VisualCode.ALLOWED_CHARS.length];
  },

  // Generate a complete visual code
  generate: (prefix = "BX", digits = "1234") => {
    const checksum = VisualCode.generateChecksum(prefix, digits);
    return `${prefix}-${digits}-${checksum}`;
  },

  // Parse a visual code into its components
  parseCode: (code) => {
    // Normalize the code: uppercase and remove spaces
    code = code.toUpperCase().replace(/\s/g, "");

    // Check if the code follows the pattern BX-XXXX-C
    const match = code.match(/^([A-Z]{2})-([A-Z0-9]{4})-([A-Z0-9])$/);

    if (!match) return null;

    return {
      prefix: match[1],
      digits: match[2],
      checksum: match[3],
    };
  },

  // Validate a visual code
  validate: (code) => {
    const parsed = VisualCode.parseCode(code);
    if (!parsed) return false;

    const expected = VisualCode.generateChecksum(parsed.prefix, parsed.digits);
    return parsed.checksum === expected;
  },
};

// Test code generation
const testPrefix = "BX";
const testDigits = "1234";
const code = VisualCode.generate(testPrefix, testDigits);
const checksum = VisualCode.generateChecksum(testPrefix, testDigits);

console.log(`Generated visual code: ${code}`);
console.log(`Checksum for ${testPrefix}-${testDigits}: ${checksum}`);
console.log(`Is the code valid? ${VisualCode.validate(code)}`);

// Test a few different combinations
console.log("\nTesting different combinations:");
[
  ["BX", "1234"],
  ["BX", "9876"],
  ["CX", "5432"],
  ["AZ", "0123"],
].forEach(([prefix, digits]) => {
  const code = VisualCode.generate(prefix, digits);
  console.log(
    `${prefix}-${digits} → ${code} (Valid: ${VisualCode.validate(code)})`,
  );
});

// Test OCR error correction
console.log("\nTesting OCR error correction scenarios:");
const testCodes = [
  "BX-1234-J", // Valid
  "BX-1234-X", // Invalid checksum
  "BX-I234-J", // OCR error: I instead of 1
  "BX-I234-X", // Multiple errors
];

testCodes.forEach((code) => {
  const parsed = VisualCode.parseCode(code);
  if (parsed) {
    const correctChecksum = VisualCode.generateChecksum(
      parsed.prefix,
      parsed.digits,
    );
    const isValid = parsed.checksum === correctChecksum;
    console.log(
      `Code: ${code} => Valid: ${isValid}, Correct checksum: ${correctChecksum}`,
    );
  } else {
    console.log(`Code: ${code} => Invalid format`);
  }
});

export const VisualCode2 = {
  ALLOWED_CHARS: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",

  generateChecksum: (prefix, digits) => {
    const combined = prefix + digits;
    let sum = 0;

    for (let i = 0; i < combined.length; i++) {
      const char = combined[i];
      const pos = VisualCode2.ALLOWED_CHARS.indexOf(char);
      if (pos >= 0) {
        sum += pos * (i + 1); // Weighted by position
      }
    }

    return VisualCode2.ALLOWED_CHARS[sum % VisualCode2.ALLOWED_CHARS.length];
  },

  // generateRandomDigits: (length = 4) => {
  //   const fakeUUIDv4 = "6f19c1e9-12e9-46f8-bb65-49a74e1db21s";
  //   const uuid = fakeUUIDv4.replace(/-/g, "");
  //   let result = "";

  //   for (let i = 0; i < length; i++) {
  //     const hexPair = uuid.substring(i * 2, (i + 1) * 2); // Corrected line
  //     const byteValue = parseInt(hexPair, 16);

  //     const index = byteValue % VisualCode2.ALLOWED_CHARS.length;
  //     result += VisualCode2.ALLOWED_CHARS[index];
  //   }

  //   return result;
  // },
  generateRandomDigits: (length = 4) => {
    const nanoid = customAlphabet(VisualCode2.ALLOWED_CHARS, 20);
    return nanoid(length).slice(0, length).toUpperCase();
  },

  generateRandomVisualCode: (prefix = "BX") => {
    const digits = VisualCode2.generateRandomDigits(4);
    const checksum = VisualCode2.generateChecksum(prefix, digits);
    return `${prefix}-${digits}-${checksum}`;
  },
};

console.log(VisualCode2.generateRandomVisualCode());
console.log(VisualCode2.generateRandomVisualCode());
