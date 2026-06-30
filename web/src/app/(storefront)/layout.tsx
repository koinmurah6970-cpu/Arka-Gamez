import { Navbar } from "@/components/navbar";
import { CartProvider } from "@/components/cart-context";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Navbar />
      {children}
    </CartProvider>
  );
}
