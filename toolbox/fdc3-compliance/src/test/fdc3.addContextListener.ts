describe("fdc3.addContextListener", async () => {
  it("Conformance", async () => {
    await window.fdc3.addContextListener("fdc3.contact", (info: any) => {
      console.log(`Context listener triggered for ${info}`);
    });
  });
});
