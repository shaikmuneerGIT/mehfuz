import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Order } from "../types";
import { formatInr } from "../lib/format";
import { useCart } from "../context/CartContext";

export function OrderConfirmed() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const { clearCart } = useCart();

  useEffect(() => {
    if (!orderNumber) return;
    api.get<Order>(`/orders/${orderNumber}`).then((res) => setOrder(res.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500 text-3xl text-brown-950">
        ✓
      </div>
      <h1 className="font-display text-3xl font-bold text-brown-950">Order Placed!</h1>
      <p className="mt-2 text-brown-700">
        Thank you for shopping with Mehfuz. Your order number is
      </p>
      <p className="font-display mt-1 text-2xl font-bold text-gold-700">{orderNumber}</p>

      {order && (
        <div className="mt-8 rounded-xl border border-gold-500/30 bg-white p-6 text-left">
          <h2 className="font-display mb-3 text-lg font-bold text-brown-950">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-brown-700">
                <span>
                  {item.nameSnapshot} ({item.labelSnapshot}) × {item.quantity}
                </span>
                <span className="font-medium">{formatInr(item.priceInr * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t border-gold-500/30 pt-3 text-sm text-brown-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatInr(order.subtotalInr)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{order.shippingInr === 0 ? "Free" : formatInr(order.shippingInr)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-brown-950">
              <span>Total</span>
              <span>{formatInr(order.totalInr)}</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-brown-500">
            Delivering to {order.addressLine1}, {order.city}, {order.state} {order.pincode}
          </p>
          <p className="text-xs text-brown-500">Payment: Cash on Delivery</p>
        </div>
      )}

      <p className="mt-6 text-sm text-brown-500">
        Questions about your order? Call{" "}
        <a href="tel:+919848918992" className="text-gold-700 hover:underline">
          +91 98489 18992
        </a>
      </p>

      <Link
        to="/shop"
        className="mt-8 inline-block rounded-full bg-brown-950 px-6 py-3 text-sm font-semibold text-gold-300 hover:bg-brown-900"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
