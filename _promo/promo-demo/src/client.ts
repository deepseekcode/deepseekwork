import { fetchJson } from './api';

type Order = { id: string; total: number; status: 'open' | 'paid' };

export async function loadOrders(): Promise<Order[]> {
  return fetchJson<Order[]>('/api/orders', { retries: 2 });
}

export async function loadOrder(id: string): Promise<Order> {
  return fetchJson<Order>(`/api/orders/${id}`, { retries: 0 });
}

export function totalOf(orders: Order[]): number {
  return orders.reduce((sum, order) => sum + order.total, 0);
}
