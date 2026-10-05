const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const fs = require('fs');

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-attendance-tracker",
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080
    }
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Firestore Security Rules", () => {
  it("should allow a user to read/write their own data", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(alice.firestore().doc("users/alice").set({ name: "Alice" }));
    await assertSucceeds(alice.firestore().doc("users/alice/courses/123").set({ name: "Math" }));
  });

  it("should deny a user from reading/writing another user's data", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(alice.firestore().doc("users/bob").get());
    await assertFails(alice.firestore().doc("users/bob/courses/123").set({ name: "Math" }));
  });

  it("should deny unauthenticated users", async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertFails(unauthed.firestore().doc("users/alice").get());
  });
});
