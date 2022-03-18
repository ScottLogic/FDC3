/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright FINOS FDC3 contributors - see NOTICE file
 */

import { IntentResult } from './Types';
import { AppMetadata } from './AppMetadata';

/**
 * IntentResolution provides a standard format for data returned upon resolving an intent.
 * ```javascript
 * //resolve a "Chain" type intent
 * let resolution = await agent.raiseIntent("intentName", context);
 *
 * //resolve a "Client-Service" type intent with a data response or a Channel
 * let resolution = await agent.raiseIntent("intentName", context);
 * try {
 * 	   const result = await resolution.getResult();
 *     if (result && result.broadcast) {
 *         console.log(`${resolution.source} returned a channel with id ${result.id}`);
 *     } else if (result){
 *         console.log(`${resolution.source} returned data: ${JSON.stringify(result)}`);
 *     } else {
 *         console.error(`${resolution.source} didn't return data`
 *     }
 * } catch(error) {
 *     console.error(`${resolution.source} returned an error: ${error}`);
 * }
 * // Use metadata about the resolving app instance to target a further intent
 * await agent.raiseIntent("intentName", context, resolution.source);
 * ```
 */
export interface IntentResolution {
  /**
   * Metadata about the app instance that was selected (or started) to resolve the intent.
   * `source.instanceId` MUST be set, indicating the specific app instance that
   * received the intent.
   */
  readonly source: AppMetadata;
  /**
   * The intent that was raised. May be used to determine which intent the user
   * chose in response to `fdc3.raiseIntentForContext()`.
   */
  readonly intent: string;
  /**
   * The version number of the Intents schema being used.
   */
  readonly version?: string;
  /**
   * Retrieves a promise that will resolve to either `Context` data returned
   * by the application that resolves the raised intent or a `Channel`
   * established and returned by the app resolving the intent.
   *
   * A `Channel` returned will often be of the `PrivateChannel` type. The
   * client can then `addContextListener()` on that channel to, for example,
   * receive a stream of data.
   *
   * The promise MUST reject with a string from the `ResultError` enumeration
   * if an error is thrown by the intent handler, it rejects the returned
   * promise, it does not return a promise or the promise resolves to an
   * object of an invalid type.
   */
  getResult(): Promise<IntentResult>;
}
