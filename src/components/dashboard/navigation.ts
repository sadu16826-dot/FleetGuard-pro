import { BarChart3, CarFront, CircleGauge, ClipboardCheck, FileCheck2, Fuel, LifeBuoy, Receipt, Settings, ShieldAlert, Truck, Users, Wrench } from "lucide-react";
import type { PermissionModule } from "@/lib/permissions";

export type NavigationItem = { module: PermissionModule; label: string; href: string; icon: typeof CircleGauge; children?: { label: string; href: string }[] };

export const dashboardNavigation: NavigationItem[] = [
  { module: "DASHBOARD", label: "Dashboard", href: "/dashboard", icon: CircleGauge },
  { module: "VEHICLES", label: "Vehicle Management", href: "/vehicles", icon: CarFront, children: [
    { label: "Vehicles", href: "/vehicles" }, { label: "Vehicle Registration", href: "/vehicles/registration" }, { label: "Vehicle Documents", href: "/vehicles/documents" }, { label: "Vehicle History", href: "/vehicles/history" },
  ]},
  { module: "DRIVERS", label: "Driver Management", href: "/dashboard/drivers", icon: Users, children: [
    { label: "Drivers", href: "/dashboard/drivers" }, { label: "Licence Management", href: "/dashboard/drivers/licences" }, { label: "Passport Management", href: "/dashboard/drivers/passports" }, { label: "Driver Performance", href: "/dashboard/drivers/performance" },
  ]},
  { module: "TRIPS", label: "Vehicle Operations", href: "/dashboard/trips", icon: Truck, children: [
    { label: "Vehicle Requests", href: "/dashboard/trips/requests" }, { label: "Active Trips", href: "/dashboard/trips" }, { label: "Vehicle Check-Out", href: "/dashboard/trips/check-out" }, { label: "Vehicle Return", href: "/dashboard/trips/return" },
  ]},
  { module: "INSPECTIONS", label: "Inspection Management", href: "/dashboard/inspections", icon: ClipboardCheck, children: [
    { label: "Vehicle Details", href: "/dashboard/inspections" }, { label: "Vehicle History", href: "/dashboard/inspections/history" },
  ]},
  { module: "MAINTENANCE", label: "Maintenance Management", href: "/dashboard/maintenance", icon: Wrench, children: [
    { label: "Service Schedule", href: "/dashboard/maintenance" }, { label: "Service History", href: "/dashboard/maintenance/history" }, { label: "Repair Management", href: "/dashboard/maintenance/repairs" },
  ]},
  { module: "TYRES", label: "Tyre & Wheel Management", href: "/dashboard/tyres", icon: LifeBuoy, children: [
    { label: "Tyre Inventory", href: "/dashboard/tyres" }, { label: "Vehicle Tyres", href: "/dashboard/tyres/vehicles" }, { label: "Tyre Inspection", href: "/dashboard/tyres/inspection" }, { label: "Tyre History", href: "/dashboard/tyres/history" }, { label: "Wheel Alignment", href: "/dashboard/tyres/alignment" }, { label: "Wheel Balancing", href: "/dashboard/tyres/balancing" },
  ]},
  { module: "FUEL", label: "Fuel Management", href: "/dashboard/fuel", icon: Fuel, children: [
    { label: "Fuel Entry", href: "/dashboard/fuel/entry" }, { label: "Fuel History", href: "/dashboard/fuel" }, { label: "Fuel Analytics", href: "/dashboard/fuel/analytics" },
  ]},
  { module: "EXPENSES", label: "Expense Management", href: "/dashboard/expenses", icon: Receipt, children: [
    { label: "Expenses", href: "/dashboard/expenses" }, { label: "Bills", href: "/dashboard/expenses/bills" }, { label: "Cost Analysis", href: "/dashboard/expenses/analysis" },
  ]},
  { module: "DOCUMENTS", label: "Document & Compliance", href: "/dashboard/documents", icon: FileCheck2, children: [
    { label: "Vehicle Documents", href: "/dashboard/documents/vehicles" }, { label: "Driver Documents", href: "/dashboard/documents/drivers" }, { label: "Expiry Alerts", href: "/dashboard/documents/alerts" },
  ]},
  { module: "ACCIDENTS", label: "Accident Management", href: "/dashboard/accidents", icon: ShieldAlert, children: [
    { label: "Accident Reports", href: "/dashboard/accidents" }, { label: "Damage Reports", href: "/dashboard/accidents/damage" }, { label: "Insurance Claims", href: "/dashboard/accidents/claims" },
  ]},
  { module: "REPORTS", label: "Reports & Analytics", href: "/dashboard/reports", icon: BarChart3 },
  { module: "USERS", label: "User Management", href: "/dashboard/users", icon: Users },
  { module: "SETTINGS", label: "Settings", href: "/dashboard/settings", icon: Settings },
];
