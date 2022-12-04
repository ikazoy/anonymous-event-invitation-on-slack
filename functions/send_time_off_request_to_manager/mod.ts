import { SendMessageToAdvertiseAnEvent } from "./definition.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import { SlackFunction } from "deno-slack-sdk/mod.ts";
import {
  applicationButtonHandler,
  moreOperationsHandler,
} from "./block_actions.ts";
import { APPLY_ID, DENY_ID } from "./constants.ts";
import timeOffRequestHeaderBlocks, { applicationButton } from "./blocks.ts";
import { Storage } from "../../backend/storage.ts";
import { nowInUnixTimestampSec } from "../../lib/datetime.ts";

// Custom function that sends a message to create an event
// The message includes some Block Kit with two
// interactive buttons: one to approve, and one to deny.
export default SlackFunction(
  SendMessageToAdvertiseAnEvent,
  async ({ inputs, token }) => {
    console.log("Forwarding the following event:", inputs);
    const client = SlackAPI(token);

    const eventUuid = crypto.randomUUID();
    const createdAt = nowInUnixTimestampSec();
    await Storage.setEvent(token, {
      id: eventUuid,
      host: inputs.host,
      status: "open",
      createdAt,
      startDate: inputs.start_date,
      description: inputs.description,
      isAnonymous: inputs.is_anonymous,
      maximumNumberOfParticipants: inputs.maximum_number_of_participants ??
        0,
      minimumNumberOfParticipants: inputs.minimum_number_of_participants,
    });
    await Storage.setApplication(token, {
      id: crypto.randomUUID(),
      createdAt,
      eventId: eventUuid,
      applicant: inputs.host,
      status: "accepted",
    });

    // Create a block of Block Kit elements composed of several header blocks
    // plus the interactive approve/deny buttons at the end
    const blocks = timeOffRequestHeaderBlocks(inputs).concat([
      applicationButton(eventUuid),
    ]);

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
  applicationButtonHandler,
).addBlockActionsHandler(
  ["more_operations"],
  moreOperationsHandler,
);
