import { api } from "../api/client";

/**
 * Sends the browser to PayU's hosted checkout for an order. The server signs
 * the request (amount included), so nothing here can alter what's payable.
 */
export async function startPayuCheckout(orderNumber: string): Promise<void> {
  const res = await api.post<{ action: string; params: Record<string, string> }>(
    "/payu/initiate",
    { orderNumber }
  );

  const form = document.createElement("form");
  form.method = "POST";
  form.action = res.data.action;
  for (const [name, value] of Object.entries(res.data.params)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}
