import { SlackAPI } from "deno-slack-api/mod.ts";
import { SendMessageToAdvertiseAnEvent } from "./definition.ts";
import { BlockActionHandler } from "deno-slack-sdk/types.ts";
import { APPLY_ID } from "./constants.ts";
import timeOffRequestHeaderBlocks, {
  applicationButton,
  labelForOccupied,
} from "./blocks.ts";
import { Storage } from "../../backend/storage.ts";
import { nowInUnixTimestampSec } from "../../lib/datetime.ts";

const generateMessage = async (
  token: string,
  eventUuid: string,
  inputs: any,
) => {
  console.log("generateMessage");
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
  const userIdsOfParticipants = await Storage.getParticipantsOfEvent(
    token,
    eventUuid,
  );
  const event = await Storage.getEvent(token, eventUuid);
  console.log(`event:${JSON.stringify(event)}`);
  const blocks = timeOffRequestHeaderBlocks(inputs);
  blocks.push(blockOfNumberOfParticipants(numberOfParticipants));
  if (event.minimumNumberOfParticipants <= numberOfParticipants) {
    blocks.push(blockOfParticipantsName(userIdsOfParticipants));
  }
  const isOccupied = event.maximumNumberOfParticipants <= numberOfParticipants;
  if (isOccupied) {
    blocks.push(labelForOccupied(eventUuid));
  } else {
    blocks.push(applicationButton(eventUuid));
  }

  console.log(`blocks to update: ${JSON.stringify(blocks)}`);
  return blocks;
};

export const moreOperationsHandler: BlockActionHandler<
  typeof SendMessageToAdvertiseAnEvent.definition
> = async function ({ action, body, token }) {
  console.log(
    "moreOperationsHandler Incoming action handler invocation",
    action,
  );
  console.log(
    "moreOperationsHandler Incoming action handler invocation(body)",
    body,
  );
  const client = SlackAPI(token);
  const userId = body.user.id;
  // Incoming action handler invocation {
  //   block_id: "approve-deny-buttons",
  //   action_id: "more_operations",
  //   type: "overflow",
  //   selected_option: {
  //     text: { type: "plain_text", text: "イベントをキャンセルする", emoji: true },
  //     value: '{"operationName":"cancel-event","eventId":"182cdaa5-c261-4c53-b136-308b98609293"}'
  //   },
  //   action_ts: "1670167340.098432"
  // }
  const optionValue = JSON.parse(action.selected_option.value);
  const eventId = optionValue.eventId;
  switch (optionValue.operationName) {
    case "cancel-application":
      console.log("cancel-application");
      await Storage.cancelApplication(token, eventId, userId);
      break;
    case "cancel-event":
      console.log("cancel-event");
      await Storage.cancelEvent(token, eventId);
      break;
    case "edit-event":
      console.log("edit-event");
      break;
  }
  const blocks = await generateMessage(
    token,
    eventId,
    body.function_data.inputs,
  );
  const msgUpdate = await client.chat.update({
    channel: body.container.channel_id,
    ts: body.container.message_ts,
    blocks,
  });
  return {
    completed: false,
  };
};

export const applicationButtonHandler: BlockActionHandler<
  typeof SendMessageToAdvertiseAnEvent.definition
> = async function ({ action, body, token }) {
  console.log("Incoming action handler invocation", action);
  console.log("Incoming action handler invocation(body)", body);
  const client = SlackAPI(token);

  // event uuid is passed as "value" of the button action
  const eventUuid: string = action.value;

  // TODO: check if the number of participants is within the limits

  const participants = await Storage.getParticipantsOfEvent(
    token,
    eventUuid,
  );
  const ignoreDuplicate = true;
  if (!ignoreDuplicate && participants.includes(body.user.id)) {
    client.chat.postEphemeral({
      channel: body.container.channel_id,
      user: body.user.id,
      token,
      text: "イベントに参加済みです。",
    });
    return {
      completed: false,
    };
  }

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
    createdAt: nowInUnixTimestampSec(),
    eventId: eventUuid,
    applicant: body.user.id,
    status: "accepted",
  });
  console.log("setApplication done");

  // TODO: check if the number of applications is enough to start the event

  const blocks = await generateMessage(
    token,
    eventUuid,
    body.function_data.inputs,
  );
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
  // await client.functions.completeSuccess({
  //   function_execution_id: body.function_data.execution_id,
  //   outputs: {},
  // });
  return {
    completed: false,
  };
};
