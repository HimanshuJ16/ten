import BlurFade from "@/components/landing-page/magicui/blur-fade";
import Section from "@/components/landing-page/section";
import { Card, CardContent } from "@/components/landing-page/ui/card";
import { Truck, MapPin, AlertTriangle } from "lucide-react";

const problems = [
  {
    title: "Inefficient Booking Process",
    description:
      "Manually coordinating water tanker requests leads to delays and mismanagement, making it difficult to ensure timely deliveries.",
    icon: Truck,
  },
  {
    title: "Lack of Real-Time Tracking",
    description:
      "Without live tracking, monitoring tanker movements and delivery status becomes challenging, causing operational inefficiencies.",
    icon: MapPin,
  },
  {
    title: "Unauthorized Usage & Mismanagement",
    description:
      "Lack of proper management can lead to unauthorized use of tankers, affecting efficiency, cost control, and service reliability.",
    icon: AlertTriangle,
  },
];

export default function Component() {
  return (
    <Section
      title="Problem"
      subtitle="Managing Water Tankers is a Challenge."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {problems.map((problem, index) => (
          <BlurFade key={index} delay={0.2 + index * 0.2} inView>
            <Card className="bg-background border-none shadow-none">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <problem.icon className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </CardContent>
            </Card>
          </BlurFade>
        ))}
      </div>
    </Section>
  );
}
