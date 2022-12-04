import { SlackAPI } from "deno-slack-api/mod.ts";
import { Application, Event } from "./interfaces.ts";
import {
  ApplicationsDatastore,
  EventsDatastore,
} from "../datastore/definition.ts";

export class Storage {
  static getEvent = async (
    token: string,
    id: string,
  ): Promise<Event> => {
    // console.log(
    //   `Executing getSettings(token: ${token}, channel_id: ${channel_id})`,
    // );
    const client = SlackAPI(token, {});
    const get_response = await client.apps.datastore.get<
      typeof EventsDatastore.definition
    >({
      datastore: "events",
      id,
    });

    if (!get_response.ok) {
      console.log(`Error calling apps.datastore.get: ${get_response.error}`);
      throw new Error(get_response.error);
    }

    console.log(`Event retrieved: ${JSON.stringify(get_response)}`);
    return get_response.item;
  };

  static setEvent = async (
    token: string,
    event: Event,
  ) => {
    const client = SlackAPI(token, {});
    console.log(
      `Executing setEvent(token: ${token}, event: ${JSON.stringify(event)})`,
    );
    const put_response = await client.apps.datastore.put<
      typeof EventsDatastore.definition
    >({
      datastore: "events",
      item: event,
    });

    if (!put_response.ok) {
      console.log(`Error calling apps.datastore.put: ${put_response.error}`);
      throw new Error(put_response.error);
    }
  };

  static cancelEvent = async (
    token: string,
    eventUuid: string,
  ) => {
    const event = await Storage.getEvent(token, eventUuid);
    event.status = "cancelled";
    await Storage.setEvent(token, event);
  };

  static getParticipantsOfEvent = async (
    token: string,
    eventUuid: string,
  ): Promise<string[]> => {
    const client = SlackAPI(token, {});
    console.log(`eventUuid: ${eventUuid}`);
    const get_response = await client.apps.datastore.query({
      datastore: "applications",
      expression: "#eventId = :eventId and #status = :status",
      expression_attributes: { "#eventId": "eventId", "#status": "status" },
      expression_values: { ":eventId": eventUuid, ":status": "accepted" },
    });

    console.log(`get_response: ${JSON.stringify(get_response)}`);

    if (!get_response.ok) {
      console.log(
        `Error calling apps.datastore.get: ${get_response.error}`,
      );
      throw new Error(get_response.error);
    }
    console.log(`Applications retrieved: ${JSON.stringify(get_response)}`);
    return get_response.items.map((item) => item.applicant);
  };

  static getNumberOfApplications = async (
    token: string,
    eventUuid: string,
  ): Promise<number> => {
    console.log(
      `Executing getNumberOfApplications(token: ${token}, eventUuid: ${eventUuid})`,
    );

    return (await this.getParticipantsOfEvent(token, eventUuid)).length;
  };

  static getApplication = async (
    token: string,
    eventUuid: string,
    userId: string,
  ): Promise<Application> => {
    const client = SlackAPI(token, {});

    const get_response = await client.apps.datastore.query<
      typeof ApplicationsDatastore.definition
    >({
      datastore: "applications",
      expression: "#eventId = :eventId and #applicant = :applicant",
      expression_attributes: {
        "#eventId": "eventId",
        "#applicant": "applicant",
      },
      expression_values: { ":eventId": eventUuid, ":applicant": userId },
    });

    if (!get_response.ok) {
      console.log(`Error calling apps.datastore.get: ${get_response.error}`);
      throw new Error(get_response.error);
    }

    console.log(`Application retrieved: ${JSON.stringify(get_response)}`);
    return get_response.items[0];
  };

  static setApplication = async (
    token: string,
    application: Application,
  ) => {
    console.log(
      `Executing setApplication(token: ${token}, application: ${
        JSON.stringify(application)
      })`,
    );
    const client = SlackAPI(token, {});
    const put_response = await client.apps.datastore.put({
      datastore: "applications",
      item: application,
    });

    if (!put_response.ok) {
      console.log(`Error calling apps.datastore.put: ${put_response.error}`);
      throw new Error(put_response.error);
    }
  };

  static cancelApplication = async (
    token: string,
    eventUuid: string,
    userId: string,
  ) => {
    const application = await Storage.getApplication(token, eventUuid, userId);
    application.status = "cancelled";
    await Storage.setApplication(token, application);
  };
}
