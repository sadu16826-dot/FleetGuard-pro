import { Activity, BellRing, CarFront, ClipboardCheck, FileCheck2, Fuel, Gauge, HardHat, HeartPulse, Receipt, ShieldCheck, Truck, UserRoundCheck, UsersRound, Warehouse, Wrench } from "lucide-react";

export const industries = [
  { name: "Construction", icon: HardHat }, { name: "Logistics", icon: Warehouse },
  { name: "Transportation", icon: Truck }, { name: "Healthcare", icon: HeartPulse },
  { name: "Corporate Fleets", icon: UsersRound },
];

export const solutions = [
  { title: "Vehicle management", text: "Keep every vehicle record, status and document current in one reliable source of truth.", icon: CarFront },
  { title: "Driver management", text: "Manage profiles, assignments, licenses and performance without scattered spreadsheets.", icon: UserRoundCheck },
  { title: "Maintenance alerts", text: "Schedule service by time or mileage and act before small issues become downtime.", icon: Wrench },
  { title: "Inspection system", text: "Standardize pre-trip and post-trip checks with photo evidence and clear accountability.", icon: ClipboardCheck },
  { title: "Expense tracking", text: "Understand fuel, service and operating costs at vehicle and fleet level.", icon: Receipt },
  { title: "Compliance management", text: "Track insurance, permits and licenses with proactive expiry notifications.", icon: ShieldCheck },
];

export const features = [
  ["Vehicle registration", "A complete digital record for every vehicle.", CarFront], ["Driver profiles", "Licenses, assignments and history in one view.", UserRoundCheck],
  ["Digital inspections", "Consistent checks with notes and photo proof.", ClipboardCheck], ["Service scheduling", "Plan preventive work by date or mileage.", Wrench],
  ["Tyre monitoring", "Track fitment, position and tyre condition.", Gauge], ["Fuel tracking", "Monitor consumption, mileage and spend.", Fuel],
  ["Accident reports", "Capture incidents accurately at the source.", Activity], ["Document management", "Secure files with visible expiry dates.", FileCheck2],
  ["Automated alerts", "Put important actions in front of the right people.", BellRing], ["Analytics dashboard", "Turn operating data into confident decisions.", Gauge],
] as const;
