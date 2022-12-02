import { SlackAPI } from "deno-slack-api/mod.ts";
import { SendMessageToAdvertiseAnEvent } from "./definition.ts";
import { BlockActionHandler } from "deno-slack-sdk/types.ts";
import { APPLY_ID } from "./constants.ts";
import timeOffRequestHeaderBlocks from "./blocks.ts";
import { ApplicationsDatastore } from "../../datastore/definition.ts";

const block_actions: BlockActionHandler<
  typeof SendMessageToAdvertiseAnEvent.definition
> = async function ({ action, body, token }) {
  console.log("Incoming action handler invocation", action);
  console.log("Incoming action handler invocation(body)", body);
  const client = SlackAPI(token);

  const approved = action.action_id === APPLY_ID;
  // event uuid is passed as "value" of the button action
  const eventUuid = action.value;

  // TODO: Send a confirmation message to an user who applied to the event
  // Send manager's response as a message to employee
  // const msgResponse = await client.chat.postMessage({
  //   channel: body.function_data.inputs.employee,
  //   blocks: [{
  //     type: "context",
  //     elements: [
  //       {
  //         type: "mrkdwn",
  //         text:
  //           `Your time off request from ${body.function_data.inputs.start_date} to ${body.function_data.inputs.end_date}` +
  //           `${
  //             body.function_data.inputs.reason
  //               ? ` for ${body.function_data.inputs.reason}`
  //               : ""
  //           } was ${
  //             approved ? " :white_check_mark: Approved" : ":x: Denied"
  //           } by <@${body.user.id}>`,
  //       },
  //     ],
  //   }],
  //   text: `Your time off request was ${approved ? "approved" : "denied"}!`,
  // });
  // if (!msgResponse.ok) {
  //   console.log(
  //     "Error during requester update chat.postMessage!",
  //     msgResponse.error,
  //   );
  // }

  // TODO: Save the application to the database
  const applicationUuid = crypto.randomUUID();
  const response = await client.apps.datastore.put<
    typeof ApplicationsDatastore.definition
  >({
    datastore: "applications",
    item: {
      id: applicationUuid,
      createdAt: Math.floor(Date.now() / 1000),
      eventId: eventUuid,
      applicant: body.user.id,
    },
  });
  if (!response.ok) {
    // TODO: error handling
    console.error(response);
  }

  // TODO: Update the advertisement message with the response to increment/decrement the number of participants
  // Nice little touch to prevent further interactions with the buttons
  // after capacity is full.
  const msgUpdate = await client.chat.update({
    channel: body.container.channel_id,
    ts: body.container.message_ts,
    blocks: timeOffRequestHeaderBlocks(body.function_data.inputs).concat([
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `${approved ? " :white_check_mark: Approved" : ":x: Denied"}`,
          },
        ],
      },
    ]),
  });
  if (!msgUpdate.ok) {
    console.log("Error during manager chat.update!", msgUpdate.error);
  }

  // And now we can mark the function as 'completed' - which is required as
  // we explicitly marked it as incomplete in the main function handler.
  await client.functions.completeSuccess({
    function_execution_id: body.function_data.execution_id,
    outputs: {},
  });
};

export default block_actions;
