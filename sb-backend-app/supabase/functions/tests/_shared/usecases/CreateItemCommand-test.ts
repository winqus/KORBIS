import {
  assert,
  assertEquals,
  assertExists,
  assertGreater,
} from "jsr:@std/assert";
import { CreateItemCommand } from "../../../_shared/usecases/index.ts";

Deno.test("Creates CreateItemCommand", () => {
  console.log("Creating CreateItemCommand instance...");

  const command = CreateItemCommand.create({
    userId: "550e8400-e29b-41d4-a716-446655440000",
    name: "Test Item",
    description: "This is a test item",
    imageBase64:
      "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVR42mP8z8AIAwAB/9i5k2AAAAAElFTkSuQmCC",
  });

  assertExists(command);
  assertEquals(command.userId, "550e8400-e29b-41d4-a716-446655440000");
});

// deno test ./supabase/**/*.ts --ignore=**/*-e2e-test.ts --ignore=**/index.ts --coverage -A -c .\supabase\functions\deno.json --no-check --unstable-detect-cjs

//  deno test -A -c .\supabase\functions\deno.json .\supabase\functions\tests\_shared\usecases\CreateItemCommand-test.ts
// import "reflect-metadata";
// import { IsString } from "class-validator";
// class SomeCommand {
//   @IsString()
//   userId: string;

//   static create(data: { userId: string }) {
//     const objectInstance = new SomeCommand();
//     objectInstance.userId = data.userId;
//     return objectInstance;
//   }
// }

// Deno.test("Creates SomeCommand instance", () => {
//   console.log("Creating SomeCommand instance...");

//   const command = SomeCommand.create({
//     userId: "useris",
//   });

//   assertExists(command);
//   assert(command instanceof SomeCommand);
//   assertEquals(command.userId, "useris");
// });
