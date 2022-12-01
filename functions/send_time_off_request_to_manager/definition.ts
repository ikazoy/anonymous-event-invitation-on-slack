import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";

/**
 * Custom function that sends a message to a channel to create a new event.
 * The message includes some Block Kit with two interactive
 * buttons: one to apply, and one to deny.
 */
export const SendMessageToAdvertiseAnEvent = DefineFunction({
  callback_id: "send_message_to_advertise_an_event",
  title: "Send Message to Advertise an Event",
  description: "Send a message to a channel to create a new event",
  // TODO: rename the dir
  source_file: "functions/send_time_off_request_to_manager/mod.ts",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
      host: {
        type: Schema.slack.types.user_id,
        description: "The user requesting the time off",
      },
      start_date: {
        type: "slack#/types/timestamp",
        description: "Time off start date",
      },
      description: {
        type: Schema.types.string,
        description: "The reason for the time off request",
      },
      is_anonymous: {
        type: Schema.types.boolean,
        description: "aaaa",
      },
    },
    required: [
      "start_date",
      "channel",
      "description",
      "is_anonymous",
      "host",
      "interactivity",
    ],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});
