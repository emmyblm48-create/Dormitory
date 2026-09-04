export interface Room {
  room_id: number;
  room_number: string;
  floor: string | null;
  rent_price: number;
}

export interface Category {
  category_id: number;
  category_name: string;
}

export interface Status {
  status_id: number;
  status_name: string;
}

export interface Product {
  product_id: number;
  product_name: string;
  product_image: string | null;
  date_recieved: string | null;
  room_id: number | null;
  category_id: number | null;
  status_id: number | null;
}

export interface RoomAsset {
  asset_id: number;
  room_id: number | null;
  product_id: number | null;
  status_id: number | null;
  date_add: string | null;
}

export interface MaintenanceRequest {
  maintenance_request_id: number;
  description: string | null;
  status: string | null;
  reported_date: string | null;
  product_id: number | null;
  image_path: string | null;
  room_id: number | null;
}

export interface UserProfile {
  userName: string;
  role: "admin" | "user" | string;
  email: string;
}

// Row shape returned by the `view_room_asset` view
export interface ViewRoomAsset {
  asset_id: number;
  date_add: string | null;
  room_id: number;
  status_name: string | null;
  product_id: number;
  product_name: string;
  product_image: string | null;
}

// Row shape returned by the `view_home_user` view
export interface ViewHomeUser {
  maintenance_request_id: number;
  product_name: string;
  product_image: string | null;
  status: string | null;
  reported_date: string | null;
  description: string | null;
  image_path: string | null;
  room_number: string;
  room_id: number;
}
