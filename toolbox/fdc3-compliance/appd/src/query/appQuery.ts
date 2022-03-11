import { query } from "express";
import QueryString from "qs";
import appd from "../data/appd.json";

export const filterApps = (queryParams: QueryString.ParsedQs) => {
  let results = appd.applications;

  if (queryParams.appId) {
    results = results.filter(
      (application) => application.appId === queryParams.appId
    );
  }

  if (queryParams.name) {
    results = results.filter(
      (application) => application.name === queryParams.name
    );
  }

  if (queryParams.name) {
    results = results.filter(
      (application) => application.name === queryParams.name
    );
  }

  if (queryParams.version) {
    results = results.filter(
      (application) => application.version === queryParams.version
    );
  }

  if (queryParams.title) {
    results = results.filter(
      (application) => application.title === queryParams.title
    );
  }

  if (queryParams.intent_name) {
    results = results.filter((application) =>
      application.intents.some(
        (intent) => intent.name === queryParams.intent_name
      )
    );
  }

  if (queryParams.intent_displayName) {
    results = results.filter((application) =>
      application.intents.some(
        (intent) => intent.displayName === queryParams.intent_displayName
      )
    );
  }

  if (queryParams.intent_context) {
    results = results.filter((application) =>
      application.intents.some((intent) =>
        intent.contexts.some(
          (context) => context === queryParams.intent_context
        )
      )
    );
  }

  return results;
};
