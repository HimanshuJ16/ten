import Features from "@/components/landing-page/features-vertical";
import Section from "@/components/landing-page/section";
import { Truck, CheckCircle, MapPin } from "lucide-react";

const data = [
  {
    id: 1,
    title: "1. Register Your Tanker",
    content:
      "Simply enter your tanker details into our secure platform. Our system supports various vehicle types and capacities for seamless management.",
    image: "/assets/add.webp",
    icon: <Truck className="w-6 h-6 text-blue-500" />,
  },
  {
    id: 2,
    title: "2. Assign & Approve Bookings",
    content:
      "Once registered, bookings can be assigned based on availability. AENs & JENs can approve/disapprove requests in real-time.",
    image: "/assets/app1.webp",
    icon: <CheckCircle className="w-6 h-6 text-blue-500" />,
  },
  {
    id: 3,
    title: "3. Track & Manage Efficiently",
    content:
      "Monitor tanker movement, manage water deliveries, and generate reports to streamline operations and enhance efficiency.",
    image: "/assets/track1.webp",
    icon: <MapPin className="w-6 h-6 text-blue-500" />,
  },
];

export default function Component() {
  return (
    <Section title="How it works" subtitle="Just 3 steps to get started">
      <Features data={data} />
    </Section>
  );
}
