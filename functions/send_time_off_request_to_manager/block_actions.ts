import { SlackAPI } from "deno-slack-api/mod.ts";
import { SendMessageToAdvertiseAnEvent } from "./definition.ts";
import { BlockActionHandler } from "deno-slack-sdk/types.ts";
import { APPLY_ID } from "./constants.ts";
import timeOffRequestHeaderBlocks, { allowButton } from "./blocks.ts";
import { Storage } from "../../backend/storage.ts";

const block_actions: BlockActionHandler<
  typeof SendMessageToAdvertiseAnEvent.definition
> = async function ({ action, body, token }) {
  console.log("Incoming action handler invocation", action);
  console.log("Incoming action handler invocation(body)", body);
  const client = SlackAPI(token);

  // TODO: check if the number of participants is within the limits

  const approved = action.action_id === APPLY_ID;
  // event uuid is passed as "value" of the button action
  const eventUuid: string = action.value;

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

  const applicationUuid = crypto.randomUUID();
  await Storage.setApplication(token, {
    id: applicationUuid,
    createdAt: Math.floor(Date.now() / 1000),
    eventId: eventUuid,
    applicant: body.user.id,
  });
  console.log("setApplication done");

  // TODO: check if the number of applications is enough to start the event

  // Update the advertisement message with the response to increment/decrement the number of participants
  // Nice little touch to prevent further interactions with the buttons
  // after capacity is full.
  const blockOfNumberOfParticipants = (numberOfParticipants: number) => {
    return {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${numberOfParticipants}人参加中*`,
      },
    };
  };
  const numberOfParticipants = await Storage.getNumberOfApplications(
    token,
    eventUuid,
  );
  const blockOfParticipantsName = (participantsName: string[]) => {
    console.log(`participantsName:${participantsName}`);
    return participantsName.length > 0
      ? {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*参加者:* ${
            participantsName.map((pN) => {
              return `<@${pN}>`;
            }).concat(" ")
          }`,
        },
      }
      : null;
  };
  const userIdsOfParticipants = await Storage.getUserIdsOfEvent(
    token,
    eventUuid,
  );
  const event = await Storage.getEvent(token, eventUuid);
  console.log(`numberOfParticipants:${numberOfParticipants}`);
  console.log(`event:${JSON.stringify(event)}`);
  const blocks = timeOffRequestHeaderBlocks(body.function_data.inputs);
  if (event.maximumNumberOfParticipants >= numberOfParticipants) {
    allowButton(eventUuid);
  } else {
    allowButton(eventUuid, false);
  }
  blocks.push(blockOfNumberOfParticipants(numberOfParticipants));
  if (event.minimumNumberOfParticipants <= numberOfParticipants) {
    blocks.push(blockOfParticipantsName(userIdsOfParticipants));
  }
  // TODO: add a block to show a modal for additional operations
  // e.g. for a host to cancel the event, for an applicant to cancel the application
  console.log(`blocks to update: ${JSON.stringify(blocks)}`);
  const msgUpdate = await client.chat.update({
    channel: body.container.channel_id,
    ts: body.container.message_ts,
    blocks,
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
