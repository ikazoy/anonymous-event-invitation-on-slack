const EventStatus = {
  Open: "open",
  Cancelled: "cancelled",
  Closed: "closed",
} as const;

type EventStatus = typeof EventStatus[keyof typeof EventStatus];

export interface Event {
  id: string;
  createdAt: number;
  startDate: number;
  status: EventStatus;
  host: string;
  isAnonymous: boolean;
  maximumNumberOfParticipants: number;
  minimumNumberOfParticipants: number;
  description: string;
}

export interface Application {
  id: string;
  createdAt: number;
  eventId: Event["id"];
  applicant: string;
}
