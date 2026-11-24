import type { Metadata } from "next";

import { IpsView } from "@/views/ips-view";

export const metadata: Metadata = { title: "IPs monitorados" };

export default function IpsPage() {
  return <IpsView />;
}
