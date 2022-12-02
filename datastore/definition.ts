import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const EventsDatastore = DefineDatastore({
  name: "events",
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.types.string,
    },
    createdAt: {
      type: Schema.slack.types.timestamp,
    },
    startDate: {
      type: Schema.slack.types.timestamp,
    },
    host: {
      type: Schema.slack.types.user_id,
    },
    isAnonymous: {
      type: Schema.types.boolean,
    },
    maximumNumberOfParticipants: {
      type: Schema.types.number,
    },
    minimumNumberOfParticipants: {
      type: Schema.types.number,
    },
    description: {
      type: Schema.types.string,
    },
  },
});

export const ApplicationsDatastore = DefineDatastore({
  name: "applications",
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.types.string,
    },
    createdAt: {
      type: Schema.slack.types.timestamp,
    },
    eventId: {
      type: Schema.types.string,
    },
    applicant: {
      type: Schema.slack.types.user_id,
    },
  },
});
