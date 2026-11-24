import type { Metadata } from "next";

import { EventsView } from "@/views/events-view";

export const metadata: Metadata = { title: "Eventos" };

export default function EventsPage() {
  return <EventsView />;
}
