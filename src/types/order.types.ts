export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrderDTO {
  user_id: number;
  total_amount: number;
  status?: string;
}

export interface UpdateOrderDTO {
  user_id?: number;
  total_amount?: number;
  status?: string;
}
