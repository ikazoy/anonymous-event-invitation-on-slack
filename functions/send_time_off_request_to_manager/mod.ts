import { SendMessageToAdvertiseAnEvent } from "./definition.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import { SlackFunction } from "deno-slack-sdk/mod.ts";
import BlockActionHandler from "./block_actions.ts";
import { APPLY_ID, DENY_ID } from "./constants.ts";
import timeOffRequestHeaderBlocks from "./blocks.ts";
import { EventsDatastore } from "../../datastore/definition.ts";

// Custom function that sends a message to create an event
// The message includes some Block Kit with two
// interactive buttons: one to approve, and one to deny.
export default SlackFunction(
  SendMessageToAdvertiseAnEvent,
  async ({ inputs, token }) => {
    console.log("Forwarding the following event:", inputs);
    const client = SlackAPI(token, {});

    // TODO: Save the event to the database
    const uuid = crypto.randomUUID();
    const response = await client.apps.datastore.put<
      typeof EventsDatastore.definition
    >({
      datastore: "events",
      item: {
        id: uuid,
        host: inputs.host,
        createdAt: Math.floor(Date.now() / 1000),
        startDate: inputs.start_date,
        description: inputs.description,
        isAnonymous: inputs.is_anonymous,
        maximumNumberOfParticipants: inputs.maximum_number_of_participants ??
          null,
        minimumNumberOfParticipants: inputs.minimum_number_of_participants,
      },
    });
    if (!response.ok) {
      // TODO: error handling
      console.error(response);
    }

    // Create a block of Block Kit elements composed of several header blocks
    // plus the interactive approve/deny buttons at the end
    const blocks = timeOffRequestHeaderBlocks(inputs).concat([{
      "type": "actions",
      "block_id": "approve-deny-buttons",
      "elements": [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "参加",
          },
          action_id: APPLY_ID, // <-- important! we will differentiate between buttons using these IDs
          style: "primary",
          value: uuid,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Deny",
          },
          action_id: DENY_ID, // <-- important! we will differentiate between buttons using these IDs
          style: "danger",
        },
      ],
    }]);

    // Send the message to a selected channel
    const msgResponse = await client.chat.postMessage({
      channel: inputs.channel,
      blocks,
      // Fallback text to use when rich media can't be displayed (i.e. notifications) as well as for screen readers
      text: "A new event has been created",
    });

    if (!msgResponse.ok) {
      console.log("Error during request chat.postMessage!", msgResponse.error);
    }

    // IMPORTANT! Set `completed` to false in order to keep the interactivity
    // points (the approve/deny buttons) "alive"
    // We will set the function's complete state in the button handlers below.
    return {
      completed: false,
    };
  },
  // Create an 'actions router' which is a helper utility to route interactions
  // with different interactive Block Kit elements (like buttons!)
).addBlockActionsHandler(
  // listen for interactions with components with the following action_ids
  [APPLY_ID, DENY_ID],
  // interactions with the above components get handled by the function below
  BlockActionHandler,
);
