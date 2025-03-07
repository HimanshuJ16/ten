import Features from "@/components/landing-page/features-horizontal";
import Section from "@/components/landing-page/section";
import { MapPin, Users, ClipboardList, FileText } from "lucide-react";

const data = [
  {
    id: 1,
    title: "Real-Time Vehicle Tracking",
    content: "Monitor tanker locations and routes in real time for optimized distribution.",
    image: "/assets/track1.png",
    icon: <MapPin className="h-6 w-6 text-blue-500" />,
  },
  {
    id: 2,
    title: "Role-Based Dashboard",
    content: "Access tailored features based on your role, ensuring secure and streamlined operations.",
    image: "/assets/hero2.png",
    icon: <Users className="h-6 w-6 text-blue-500" />,
  },
  {
    id: 3,
    title: "Booking & Approval System",
    content: "Easily create bookings and get approvals from AENs or JENs for smooth trip execution.",
    image: "/assets/booking.png",
    icon: <ClipboardList className="h-6 w-6 text-blue-500" />,
  },
  {
    id: 4,
    title: "Automated Report Generation",
    content: "Generate detailed reports on water distribution, vehicle usage, and bookings with a single click.",
    image: "/assets/report.png",
    icon: <FileText className="h-6 w-6 text-blue-500" />,
  },
];

export default function Component() {
  return (
    <Section title="Features" subtitle="Efficient Water Tanker Management">
      <Features collapseDelay={5000} linePosition="bottom" data={data} />
    </Section>
  );
}
