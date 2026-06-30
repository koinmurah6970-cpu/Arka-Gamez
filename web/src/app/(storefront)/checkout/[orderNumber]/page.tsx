import { getStoreSettings } from "@/lib/store-settings";
import OrderConfirmationClient from "./order-confirmation-client";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { waAdminNumber } = await getStoreSettings();
  return <OrderConfirmationClient params={params} waAdminNumber={waAdminNumber} />;
}
