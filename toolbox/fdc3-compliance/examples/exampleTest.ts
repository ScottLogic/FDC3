import { Summary } from "../build/complianceTypes";
import runSilentTests from "../build/silentRun";

// Dummy implementation of FDC3
const fdc3 = {
  getInfo: () => {
    return {
      fdc3Version: "1.2",
      provider: "Test example",
      providerVersion: "1.0",
    };
  },
};

// Pass in the fdc3 global object to be tested
// Results are returned via callback
runSilentTests(fdc3, (results: Summary) => {
  // stats contains the summary results
  // For more details, see the passed and failed arrays
  console.log(results.stats);
});
