import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;

@service(#{
  title: "Calendar Booking API",
})
@server("http://localhost:3000", "Development server")
namespace CalendarAPI;

// --- Models ---

@doc("Meeting duration in minutes. Meetings shorter than 30 min still occupy a full 30-min slot.")
union Duration {
  ten: 10,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
}

@doc("Type of event that guests can book. Created and managed by the calendar owner.")
model EventType {
  @doc("Unique identifier (UUID v4)") id: string;
  @doc("Display name of the event type, shown to guests") @minLength(1) name: string;
  @doc("Duration of the meeting in minutes") duration: Duration;
  @doc("Creation timestamp in UTC ISO 8601") createdAt: utcDateTime;
}

@doc("Request body for creating a new event type")
model CreateEventTypeRequest {
  @doc("Display name, must not be empty") @minLength(1) name: string;
  @doc("Meeting duration: 10, 15, 20, or 30 minutes") duration: Duration;
}

@doc("Request body for partial update of an event type")
model UpdateEventTypeRequest {
  @doc("New display name, must not be empty if provided") @minLength(1) name?: string;
  @doc("New duration in minutes") duration?: Duration;
}

@doc("A booking made by a guest. Event type data (eventTypeName, duration) is denormalized — copied at creation time so bookings remain self-contained even if the event type is later modified or deleted.")
model Booking {
  @doc("Unique identifier (UUID v4)") id: string;
  @doc("ID of the event type at the time of booking (not a FK)") eventTypeId: string;
  @doc("Name of the event type, copied at creation time") eventTypeName: string;
  @doc("Meeting duration in minutes, copied at creation time") duration: Duration;
  @doc("Guest's name") guestName: string;
  @doc("Guest's email address") guestEmail: string;
  @doc("Start of the 30-min slot in UTC. Must be on a 30-min boundary within working hours (09:00–16:30)") startTime: utcDateTime;
  @doc("End of the 30-min slot (startTime + 30 min)") endTime: utcDateTime;
  @doc("Creation timestamp in UTC ISO 8601") createdAt: utcDateTime;
}

@doc("Request body for creating a booking. Backend looks up eventType to populate denormalized fields.")
model CreateBookingRequest {
  @doc("ID of the event type to book") eventTypeId: string;
  @doc("Guest's name, must not be empty") @minLength(1) guestName: string;
  @doc("Guest's email, must be a valid email address") guestEmail: string;
  @doc("Desired slot start time in UTC. Must be 30-min aligned, within 09:00–16:30, within 14 days from now") startTime: utcDateTime;
}

@doc("A 30-minute time slot. Availability is global — a slot occupied by any event type is unavailable for all.")
model Slot {
  @doc("Slot start time in UTC") startTime: utcDateTime;
  @doc("Slot end time in UTC (startTime + 30 min)") endTime: utcDateTime;
  @doc("true if slot is free for booking, false if already taken") available: boolean;
}

@doc("Standard error response returned for 400, 404, 409 errors")
model ErrorResponse {
  @doc("Human-readable error description") message: string;
}

// --- Routes ---

@doc("Event types CRUD — managed by calendar owner")
@route("/api/event-types")
namespace EventTypes {
  @doc("List all event types") @get op list(): EventType[];
  @doc("Create a new event type") @post op create(@body body: CreateEventTypeRequest): {
    @statusCode statusCode: 201;
    @body body: EventType;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  };

  @route("/{id}")
  namespace ById {
    @doc("Partially update an event type by ID") @patch op update(@path id: string, @body body: UpdateEventTypeRequest): EventType | {
      @statusCode statusCode: 404;
      @body body: ErrorResponse;
    } | {
      @statusCode statusCode: 400;
      @body body: ErrorResponse;
    };
    @doc("Delete an event type by ID. Existing bookings are preserved (denormalized).") @delete op delete(@path id: string): {
      @statusCode statusCode: 204;
    } | {
      @statusCode statusCode: 404;
      @body body: ErrorResponse;
    };
  }
}

@doc("Available time slots. Slots are global: a slot taken by any event type is unavailable for all.")
@route("/api/slots")
namespace Slots {
  @doc("Get slots for a specific date and event type. Date format: YYYY-MM-DD. Returns all 30-min slots within working hours with availability status.")
  @get op list(@doc("Date in YYYY-MM-DD format, must be within 14 days from today") @query date: string, @doc("Event type ID — used to validate existence and provide context") @query eventTypeId: string): Slot[] | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  };
}

@doc("Guest booking operations")
@route("/api/bookings")
namespace Bookings {
  @doc("Create a booking. Returns 409 if slot is already taken, 404 if eventType not found.")
  @post op create(@body body: CreateBookingRequest): {
    @statusCode statusCode: 201;
    @body body: Booking;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 409;
    @body body: ErrorResponse;
  };

  @route("/{id}")
  namespace ById {
    @doc("Get booking details by ID") @get op get(@path id: string): Booking | {
      @statusCode statusCode: 404;
      @body body: ErrorResponse;
    };
    @doc("Cancel (delete) a booking by ID. Physically removes the record.") @delete op cancel(@path id: string): {
      @statusCode statusCode: 204;
    } | {
      @statusCode statusCode: 404;
      @body body: ErrorResponse;
    };
  }
}

@doc("Admin endpoints — calendar owner's view of all bookings")
@route("/api/admin/bookings")
namespace AdminBookings {
  @doc("List all upcoming bookings sorted by startTime ascending") @get op list(): Booking[];
}
