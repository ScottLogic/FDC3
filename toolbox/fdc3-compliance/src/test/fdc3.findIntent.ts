import { ResolveError } from "@finos/fdc3";

const ExpectedErrorNotThrownError = "Expected error NoAppsFound not thrown";

describe("fdc3.findIntent", () => {
  it("Method is callable", async () => {
    try {
      await window.fdc3.findIntent("ThisIntentDoesNotExist");
      throw ExpectedErrorNotThrownError;
    } catch (ex) {
      if ((ex.message ?? ex) !== ResolveError.NoAppsFound) {
        throw new Error(ExpectedErrorNotThrownError + "\nException thrown: " + (ex.message ?? ex));
      }
    }
  });
});
