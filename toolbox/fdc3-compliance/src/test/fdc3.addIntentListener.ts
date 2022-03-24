import { Listener } from "@finos/fdc3";

<<<<<<< HEAD
export default () =>
  describe("fdc3.addIntentListener", () => {
    let listener: Listener;

    afterEach(() => {
      if (listener !== undefined) {
        listener.unsubscribe();
        listener = undefined;
      }
    });

    it("Method is callable", async () => {
      const intentName = "fdc3.conformanceListener";
      listener = await window.fdc3.addIntentListener(
        intentName,
        (info: any) => {
          console.log(
            `Intent listener for intent ${intentName} triggered with result ${info}`
          );
        }
=======
describe("fdc3.addIntentListener", () => {
  let listener: Listener;

  afterEach(async () => {
    listener.unsubscribe();
  });

  it("Method is callable", async () => {
    const intentName = "fdc3.conformanceListener";
    listener = await window.fdc3.addIntentListener(intentName, (info: any) => {
      console.log(
        `Intent listener for intent ${intentName} triggered with result ${info}`
>>>>>>> master
      );
    });
  });
