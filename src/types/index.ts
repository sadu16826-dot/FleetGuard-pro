export type UserRole = "ADMIN" | "FLEET_MANAGER" | "DRIVER" | "EMPLOYEE";
export interface User { id: string; name: string; email?: string; role: UserRole; }
export interface Vehicle { id: string; registrationNumber: string; name: string; status: "AVAILABLE" | "IN_USE" | "SERVICE" | "REPAIR" | "INSPECTION_REQUIRED"; currentKm: number; }
export interface Driver { id: string; name: string; licenseNumber: string; licenseExpiry: string; status: "ACTIVE" | "INACTIVE" | "SUSPENDED"; }
export interface Trip { id: string; vehicleId: string; driverId: string; destination: string; startTime: string; status: "PLANNED" | "RUNNING" | "COMPLETED" | "CANCELLED"; }
export interface Inspection { id: string; tripId: string; type: "PRE_TRIP" | "POST_TRIP"; completedAt?: string; notes?: string; }
export interface Service { id: string; vehicleId: string; type: string; dueDate?: string; dueKm?: number; status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"; }
export interface Tyre { id: string; vehicleId: string; position: string; brand: string; condition: string; }
export interface Expense { id: string; vehicleId: string; category: string; amount: number; date: string; }
export interface Document { id: string; ownerId: string; type: string; expiryDate?: string; fileUrl: string; }
export interface Accident { id: string; vehicleId: string; driverId: string; date: string; status: "REPORTED" | "INVESTIGATING" | "RESOLVED"; }
