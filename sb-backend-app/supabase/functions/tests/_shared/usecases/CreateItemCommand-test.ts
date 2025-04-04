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
    userId: "useris",
    domainId: "amongus",
    name: "Test Item",
    description: "This is a test item",
    imageBase64:
      "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVR42mP8z8AIAwAB/9i5k2AAAAAElFTkSuQmCC",
  });

  assertExists(command);
  assertEquals(command.userId, "useris");
});

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
