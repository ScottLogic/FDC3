---
id: spec
sidebar_label: API Specification
title: API Specification (next)
---

## Components
### Desktop Agent
A Desktop Agent is a desktop component (or aggregate of components) that serves as a launcher and message router (broker) for applications in its domain.  A Desktop Agent can be connected to one or more App Directories and will use directories for application identity and discovery. Typically, a Desktop Agent will contain the proprietary logic of a given platform, handling functionality like explicit application interop workflows where security, consistency, and implementation requirements are proprietary.

Examples of Desktop Agents include:

- Autobahn
- Cosaic's Finsemble
- Glue42
- OpenFin
- Refinitiv Eikon

Desktop Agents expose an FDC3 standard API to applications they have launched.  When an App is launched by a Desktop Agent and is given access to the Agent's API to interoperate, it is running in that Desktop Agent's *context*.

#### Desktop Agent Implementation
The FDC3 API specification consists of interfaces.  It is expected that each Desktop Agent will implement these interfaces.  A typical implemention would provide instantiable classes for the following interfaces:

- `DesktopAgent`
- `Channel`
- `PrivateChannel`
- `Listener`

Other interfaces defined in the spec are not critical to define as concrete types.  Rather, the Desktop Agent should expect to have objects of the interface shape passed into or out of their library.  These interfaces include:

- `Context`
- `AppIntent`
- `IntentResolution`
- `AppMetadata`
- `IntentMetadata`
- `DisplayMetadata`


#### API Access
The FDC3 API can be made available to an application through a number of different methods.  In the case of web applications, a Desktop Agent MUST provide the FDC3 API via a global accessible as `window.fdc3`. Implementors MAY additionally make the API available through modules, imports, or other means.

The global `window.fdc3` must only be available after the API is ready to use. To enable applications to avoid using the API before it is ready, implementors MUST provide a global `fdc3Ready` event. Here is code demonstrating the use of the FDC3 API and the ready event:

```js
function fdc3Stuff() {
  // Make fdc3 API calls here
}

if (window.fdc3) {
  fdc3Stuff();
} else {
  window.addEventListener('fdc3Ready', fdc3Stuff);
}
```

#### Standards vs. Implementation
![Desktop Agent - Standards Schematic](assets/api-1.png)

The surface area of FDC3 standardization (shown in *white* above) itself is quite small in comparison to the extent of a typical desktop agent implementation (in *grey*).

For example:
- workspace management
- user identity and SSO
- entitlements
- UX of application resolution

Are all areas of functionality that any feature complete desktop agent would implement, but are not currently areas considered for standardization under FDC3.

#### Inter-Agent Communication
A goal of FDC3 standards is that applications running in different Desktop Agent contexts on the same desktop would be able to interoperate.  And that one Desktop Agent context would be able to discover and launch an application in another Desktop Application context.

![Desktop Agent - Interop](assets/api-2.png)

Desktop Agent interop is supported by common standards for APIs for App discovery and launching.  So, an App in one Desktop Agent context would not need to know a different syntax to call an App in another Desktop Agent context.

The actual connection protocol between Desktop Agents is not currently in scope for FDC3 standards.  Given that there are a relatively small number of Desktop Agents, and that any given desktop will have a finite and relatively static number of Desktop Agents installed at any given time, the connectivity between different Agents can be adequetly handled for the time being on a case-by-case basis.

### Application
An application is any endpoint on the desktop that is:
- Registered with/known by a Desktop Agent
- Launchable by a Desktop Agent
- Addressable by a Desktop Agent

Examples of End Points include:
- Native Applications
- PWA/Web Applications
- Headless “services” running on the desktop

## Functional Use Cases
### Open an Application by Name
Linking from one application to another is a critical basic workflow that the web revolutionized via the hyperlink.  Supporting semantic addressing of applications across different technologies and platform domains greatly reduces friction in linking different applications into a single workflow.

### Raising Intents
Often, we want to link from one app to another to dynamically create a workflow.  Enabling this without requiring prior knowledge between apps is a key goal of FDC3.

Intents provide a way for an app to request functionality from another app and defer the discovery and launching of the destination app to the Desktop Agent.  There are multiple models for interop that intents can support.

- **Chain**:  In this case the workflow is completely handed off from one app to another (similar to linking).  Currently, this is the primary focus in FDC3.
- **Client-Service**: A Client invokes a Service via the Intent, the Service performs some function, then passes the workflow back to the Client. Typically, there is a data payload type associated with this intent that is published as the standard contract for the intent.
- **Remote API**: An app wants to remote an entire API that it owns to another App.  In this case, the API for the App cannot be standardized.  However, the FDC3 API can address how an App connects to another App in order to get access to a proprietary API.

#### Intents and Context
When raising an intent a specific context may be provided as input. The type of the provided context may determine which applications can resolve the intent.

A context type may also be associated with multiple intents. For example, an `fdc3.instrument` could be associated with `ViewChart`, `ViewNews`, `ViewAnalysis` or other intents. In addition to raising a specific intent, you can raise an intent for a specific context allowing the Desktop Agent or the user (if the intent is ambiguous) to select the appropriate intent for the selected context and then to raise that intent for resolution.

To raise an Intent without a context, use the [`fdc3.nothing`](../context/ref/Nothing) context type. This type exists so that applications can explicitly declare that they support raising an intent without a context (when registering an Intent listener or in an App Directory).

An optional [`IntentResult`](ref/Types#intentresult) may also be returned as output by an application handling an intent. Results maybe either a single `Context` object, or a `Channel` that may be used to send a stream of responses. The [`PrivateChannel`](ref/PrivateChannel) type is provided to support synchronisation of data transmitted over returned channels, by allowing both parties to listen for events denoting subscription and unsubscription from the returned channel. `PrivateChannels` are only retrievable via [raising an intent](ref/DesktopAgent#raiseintent).

For example, an application handling a `CreateOrder` intent might return a context representing the order and including an ID, allowing the application that raised the intent to make further calls using that ID.

An optional result type is also supported when programmatically resolving an intent via [`findIntent`](ref/DesktopAgent#findintent) or [`findIntentByContext`](ref/DesktopAgent#findintentbycontext).
#### Intent Resolution
Raising an intent will return a Promise-type object that will resolve/reject based on a number of factors.

##### Resolve
- Intent was resolved unambiguously and the receiving app was launched successfully (if necessary).
- Intent was ambiguous, a resolution was chosen by the end user, and the chosen application was launched successfully.

##### Reject
- No app matching the intent and context (if specified) was found.
- A match was found, but the receiving app failed to launch.
- The intent was ambiguous and the resolver experienced an error.

##### Resolution Object

If the raising of the intent resolves (or rejects), a standard [`IntentResolution`](ref/Metadata#intentresolution) object will be passed into the resolver function with the following format:

```ts
interface IntentResolution {
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
```

For example, to raise a specific intent:

```js
try {
  const resolution = await fdc3.raiseIntent('StageOrder', context);
}
catch (err){ ... }
```

or to raise an unspecified intent for a specific context, where the user may select an intent from a resolver dialog:

```js
try {
  const resolution = await fdc3.raiseIntentForContext(context);
  if (resolution.data) {
    const orderId = resolution.data.id;
  }
}
catch (err){ ... }
```

Use metadata about the resolving app instance to target a further intent
```js
try {
  const resolution = await fdc3.raiseIntent('StageOrder', context);
  ...

  //some time later
  await agent.raiseIntent("UpdateOrder", context, resolution.source);
}
catch (err) { ... }
```

Raise an intent and retrieve either data or a channel from the IntentResolution:
```js
let resolution = await agent.raiseIntent("intentName", context);
try {
  const result = await resolution.getResult();
  /* Detect whether the result is Context or a Channel by checking for properties unique to Channels. */
  if (result && result.broadcast) { 
    console.log(`${resolution.source} returned a channel with id ${result.id}`);
  } else if (result){
    console.log(`${resolution.source} returned data: ${JSON.stringify(result)}`);
  } else {
    console.error(`${resolution.source} didn't return anything`);
  }
} catch(error) {
  console.error(`${resolution.source} returned a data error: ${error}`);
}
```

#### Resolvers
Successful delivery of an intent depends first upon the Desktop Agent's ability to "resolve the intent" (i.e. map the intent to a specific App instance). Desktop Agents may resolve intents by any methodology. A common methodology is to display a UI that allows the user to pick the desired App for a given intent. Alternatively, the app issuing the intent may proactively handle resolution by calling [`findIntent`](ref/DesktopAgent#findintent) or [`findIntentByContext`](ref/DesktopAgent#findintentbycontext) and then raising the intent with a specific target application, e.g.:

```js
// Find apps to resolve an intent to start a chat with a given contact
const appIntent = await fdc3.findIntent("StartChat", context);
// use the returned AppIntent object to target one of the returned 
// chat apps or app instances using the AppMetadata object
await fdc3.raiseIntent("StartChat", context, appIntent.apps[0]);

//Find apps to resolve an intent and return a specified context type
const appIntent = await fdc3.findIntent("ViewContact", context, "fdc3.contact");
try {
  const resolution = await fdc3.raiseIntent(appIntent.intent, context, appIntent.apps[0].name);
  const result = await resolution.getResult();
  console.log(`${resolution.source} returned ${JSON.stringify(result)}`);
} catch(error) {
  console.error(`${resolution.source} returned a result error: ${error}`);
}

//Find apps to resolve an intent and return a channel
const appIntent = await fdc3.findIntent("QuoteStream", context, "channel");
try {
  const resolution = await fdc3.raiseIntent(appIntent.intent, context, appIntent.apps[0].name);
  const result = await resolution.getResult();
  if (result && result.addContextListener) {
    result.addContextListener(null, (context) => { 
      console.log(`received context: ${JSON.stringify(context)}`); 
    });
  } else {
    console.log(`${resolution.source} didn't return a channel! Result: ${JSON.stringify(result)}`);
  }
} catch(error) {
  console.error(`${resolution.source} returned a result error: ${error}`);
}

//Find apps that can perform any intent with the specified context
const appIntents = await fdc3.findIntentByContext(context);
//use the returned AppIntent array to target one of the returned apps
await fdc3.raiseIntent(appIntent[0].intent, context, appIntent[0].apps[0]);
```

Result context types requested are represented by their type name. A channel may be requested by passing the string `"channel"` or a channel that returns a specific type via the syntax `"channel<contextType>"`, e.g. `"channel<fdc3.instrument>"`. Requesting intent resolution to an app returning a channel MUST include apps that are registered as returning a channel with a specific type. 

#### Upgrading to a Remote API Connection
There are a wide range of workflows where decoupled intents and/or context passing do not provide rich enough interactivity and applications are better off exposing proprietary APIs.  In these cases, an App can use the *source* property on the resolution of an intent to connect directly to another App and from there, call remote APIs using the methods available in the Desktop Agent context for the App.  For example:

```js
const chart = await fdc3.raiseIntent('ViewChart');
// construct a vendor wrapper for the App
const chartApp = fin.Application.wrap(chart.source);
// do some vendor-specific stuff
```
![Upgrading Connection to Remote API](assets/api-3.png)

### Register an Intent Handler
Applications need to let the system know the intents they can support.  Typically, this is done via registration with an App Directory.  It is also possible for intents to be registered at the application level as well to support ad-hoc registration which may be helpful at development time.  Although dynamic registration is not part of this specification, a Desktop Agent agent may choose to support any number of registration paths.

#### Compliance with Intent Standards
Intents represent a contract with expected behaviour if an app asserts that it supports the intent.  Where this contract is enforceable by schema (for example, return object types), the FDC3 API implementation should enforce compliance and return an error if the interface is not met.

It is expected that App Directories will also curate listed apps and ensure that they are complying with declared intents.

### Send/broadcast Context
On the financial desktop, applications often want to broadcast context to any number of applications.  Context sharing needs to support concepts of different groupings of applications as well as data privacy concerns.  Each Desktop Agent will have its own rules for supporting these features. However, a Desktop Agent SHOULD ensure that context messages broadcast to a channel by an application joined to it are not delivered back to that same application.

In some cases, application want to communicate with a single application or service and to prevent other applications from participating in the communication. For single transactions, this can be implemented via a raised intent, which will be delivered to single application that can, optionally, respond with data. Alternatively, it may instead respond with a [`Channel`](ref/Channel) or [`PrivateChannel`](ref/PrivateChannel) over which a stream of responses or a dialog can be supported.

### Retrieve Metadata about the Desktop Agent implementation
From version 1.2 of the FDC3 specification, Desktop Agent implementations MUST provide a `fdc3.getInfo()` function to allow apps to retrieve information about the version of the FDC3 specification supported by a Desktop Agent implementation and the name of the implementation provider. This metadata can be used to vary the behavior of an application based on the version supported by the Desktop Agent, e.g.:

```js
import {compareVersionNumbers, versionIsAtLeast} from '@finos/fdc3';

if (fdc3.getInfo && versionIsAtLeast(await fdc3.getInfo(), '1.2')) {
  await fdc3.raiseIntentForContext(context);
} else {
  await fdc3.raiseIntent('ViewChart', context);
}
```

## Context Channels

Context channels allows a set of apps to share a stateful piece of data between them, and be alerted when it changes.  Use cases for channels include color linking between applications to automate the sharing of context and topic based pub/sub such as theme.

There are three types of channels, which have different visibility and discoverability semantics:

1. **_User channels_**, which: 
    * facilitate the creation of user-controlled context links between applications (often via the selection of a color channel),
    * are created and named by the desktop agent,
    * are discoverable (via the [`getUserChannels()`](ref/DesktopAgent#getuserchannels) API call),
    * can be 'joined' (via the [`joinUserChannel()`](ref/DesktopAgent#joinuserchannel) API call).

    > **Note:** Prior to FDC3 2.0, 'user' channels were known as 'system' channels. They were renamed in FDC3 2.0 to reflect their intended usage, rather than the fact that they are created by system (which could also create 'app' channels).

    > **Note:** Earlier versions of FDC3 included the concept of a 'global' system channel
    which was deprecated in FDC3 1.2 and removed in FDC3 2.0.

2. **_App channels_**, which: 
    * facilitate developer controlled messaging between applications,
    * are created and named by applications (via the [`getOrCreateChannel()`](ref/DesktopAgent#getorcreatechannel) API call),
    * are not discoverable,
    * are interacted with via the [Channel API](ref/Channel) (accessed via the desktop agent [`getOrCreateChannel`](ref/DesktopAgent#getorcreatechannel) API call)

3. **_Private_** channels, which: 
    * facilitate private communication between two parties, 
    * have an auto-generated identity and can only be retrieved via a raised intent.

Channels are interacted with via `broadcast` and `addContextListener` functions, allowing an application to send and receive Context objects via the channel. For User channels, these functions are provided on the Desktop Agent, e.g. [`fdc3.broadcast(context)`](ref/DesktopAgent#broadcast), and apply to channels joined via [`fdc3.joinUserChannel`](ref/DesktopAgent#joinuserchannel). For App channels, a channel object must be retrieved, via [`fdc3.getOrCreateChannel(channelName)`](ref/DesktopAgent#getorcreatechannel), which provides the functions, e.g. [`myChannel.broadcast(context)`](ref/Channel#broadcast). For `PrivateChannels`, a channel object must also be retrieved, but via an intent raised with [`fdc3.raiseIntent(intent, context)`](ref/DesktopAgent#raiseintent) and returned as an [`IntentResult`](ref/Types#intentresult).

Channel implementations should ensure that context messages broadcast by an application on a channel are not  delivered back to that same application if they are also listening on the channel.

### Joining Channels
Apps can join _User channels_.  An app can only be joined to one User channel at a time.  

When an app is joined to a User channel, calls to [`fdc3.broadcast`](ref/DesktopAgent#broadcast) will be routed to that channel and listeners added through [`fdc3.addContextListener`](ref/DesktopAgent#addcontextlistener) will receive context broadcasts from other apps also joined to that channel. If an app is not joined to a User channel [`fdc3.broadcast`](ref/DesktopAgent#broadcast) will be a no-op and handler functions added with  [`fdc3.addContextListener`](ref/DesktopAgent#addcontextlistener) will not receive any broadcasts. However, apps can still choose to listen and broadcast to specific channels (both User and App channels) via the methods on the [`Channel`](ref/Channel) class.

When an app joins a User channel, or adds a context listener when already joined to a channel, it will automatically receive the current context for that channel.

It is possible that a call to join a User channel could be rejected.  If for example, the desktop agent wanted to implement controls around what data apps can access.

Joining channels in FDC3 is intended to be a behavior initiated by the end user. For example: by color linking or apps being grouped in the same workspace.  Most of the time, it is expected that apps will be joined to a channel by mechanisms outside of the app. To support programmatic management of joined channels and the implementation of channel selector UIs other than those provided outside of the app, Desktop Agent implementations MAY provide [`fdc3.joinChannel()`](ref/DesktopAgent#joinchannel), [`fdc3.getCurrentChannel()](ref/DesktopAgent#getcurrentchannel) and [`fdc3.leaveCurrentChannel()`](ref/DesktopAgent#leavecurrentchannel) functions and if they do, MUST do so as defined in the [Desktop Agent API reference](ref/DesktopAgent). 

There SHOULD always be a clear UX indicator of what channel an app is joined to.

### Direct Listening and Broadcast on Channels
While joining User channels automates a lot of the channel behavior for an app, it has the limitation that an app can belong to only one channel at a time.  Listening and Broadcasting to channels using the [`Channel.addContextListener`](ref/Channel#addcontextlistener) and the [`Channel.broadcast`](ref/Channel#broadcast) APIs provides an app with fine-grained controls for specific channels.  This is especially useful for working with dynamic _App Channels_.

### Broadcasting and listening for multiple context types
The [Context specification](../../context/spec#assumptions) recommends that complex context objects are defined using simpler context types for particular fields. For example, a `Position` is composed of an `Instrument` and a holding amount. This leads to situations where an application may be able to receive or respond to context objects that are embedded in a more complex type, but not the more complex type itself. For example, a pricing chart might respond to an `Instrument` but doesn't know how to handle a `Position`. 

To facilitate context linking in such situations it is recommended that applications `broadcast` each context type that other apps (listening on a User Channel or App Channel) may wish to process, starting with the simpler types, followed by the complex type. Doing so allows applications to filter the context types they receive by adding listeners for specific context types - but requires that the application broadcasting context make multiple broadcast calls in quick succession when sharing its context.

### Examples
To find a User channel, one calls:

```js
// returns an array of channels
const allChannels = await fdc3.getUserChannels();
const redChannel = allChannels.find(c => c.id === 'red');
```

#### Joining User channels

To join a User channel, one calls:

```js
fdc3.joinUserChannel(redChannel.id);
```

Calling `fdc3.broadcast` will now route context to the joined channel.

Channel implementations SHOULD ensure that context messages broadcast by an application on a channel are not delivered back to that same application if they are joined to the channel.

  > Prior to FDC3 2.0, 'user' channels were known as 'system' channels. They were renamed in FDC 2.0 to reflect their intended usage, rather than the fact that they are created by system (which could also create 'app' channels). The `joinChannel` function was also renamed to `joinUserChannel` to clarify that it is only intended to be used to join 'user', rather than 'app', channels.

#### App Channels

App Channels are topics dynamically created by applications connected via FDC3. For example, an app may create a channel to broadcast to others data or status specific to that app.

To get (or create) a channel reference, then interact with it:

```js
const appChannel = await fdc3.getOrCreateChannel('my_custom_channel');
// get the current context of the channel
const current = await appChannel.getCurrentContext();
// add a listener
await appChannel.addContextListener(null, context => {...});
// broadcast to the channel
await appChannel.broadcast(context);
```

An app can still explicitly receive context events on any channel, regardless of the channel it is currently joined to.

```js
// check for current fdc3 channel
let joinedChannel = await fdc3.getCurrentChannel()
//current channel is null, as the app is not currently joined to a channel

//add a context listener for channels we join
const listener = await fdc3.addContextListener(null, context => { ... });

//retrieve an App channel and add a listener that is specific to that channel
const myChannel = await fdc3.getOrCreateChannel('my_custom_channel');
const myChannelListener = await myChannel.addContextListener(null, context => { ... });

fdc3.joinChannel('blue')
joinedChannel = await fdc3.getCurrentChannel()
//current channel is now the 'blue' channel
```

if another application broadcasts to "my_custom_channel" (by retrieving it and broadcasting to it via `myChannel.broadcast()`) then the broadcast will be received by the specific listener (`myChannelListener`) but NOT by the listener for joined channels (`listener`).

### Private Channels

`PrivateChannels` are created to support the return of a stream of responses from a raised intent, or  private dialog between two applications. 

It is intended that Desktop Agent implementations:
 * - SHOULD restrict external apps from listening or publishing on this channel.
 * - MUST prevent `PrivateChannels` from being retrieved via `fdc3.getOrCreateChannel`.
 * - MUST provide the `id` value for the channel as required by the `Channel` interface.

The `PrivateChannel` type also supports synchronisation of data transmitted over returned channels. They do so by extending the `Channel` interface with event handlers which provide information on the connection state of both parties, ensuring that desktop agents do not need to queue or retain messages that are broadcast before a context listener is added and that applications are able to stop broadcasting messages when the other party has disconnected.

## APIs
The APIs are defined in TypeScript in [src], with documentation generated in the [docs] folder.

[src]: https://github.com/finos/FDC3/tree/master/src/api
[docs]: https://github.com/finos/FDC3/tree/master/docs/api
