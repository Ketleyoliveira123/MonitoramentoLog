import type { Metadata } from "next";

import { AlertsView } from "@/views/alerts-view";

export const metadata: Metadata = { title: "Alertas" };

export default function AlertsPage() {
  return <AlertsView />;
}
