export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  links: {
    email: "himanshujangir16@gmail.com",
  },
  faqs: [
    {
      question: "What is PhedTanker?",
      answer: (
        <span>
          PhedTanker is a tanker management system that provides a role-based
          dashboard and real-time vehicle tracking. It enables efficient booking
          approvals, trip management, and reporting for water distribution.
        </span>
      ),
    },
    {
      question: "How can I book a tanker in PhedTanker?",
      answer: (
        <span>
          You can book a tanker through the web dashboard or mobile app. Once a
          booking request is submitted, it must be approved by an AEN or JEN before
          the trip is assigned to a driver.
        </span>
      ),
    },
    {
      question: "Who can approve bookings in PhedTanker?",
      answer: (
        <span>
          Only AENs and JENs have the authority to approve or disapprove booking
          requests. Other roles can view bookings and monitor operations.
        </span>
      ),
    },
    {
      question: "Can I track my assigned tanker in real time?",
      answer: (
        <span>
          Yes, PhedTanker provides real-time GPS tracking for all assigned tankers,
          allowing authorized users to monitor their movements and trip progress.
        </span>
      ),
    },
    {
      question: "How does PhedTanker handle role-based access?",
      answer: (
        <span>
          PhedTanker follows a strict hierarchy where higher roles can manage and
          oversee the data of lower roles. Only authorized users can perform
          specific actions like booking approvals, trip creation, and report
          generation.
        </span>
      ),
    },
    {
      question: "What reports can I generate in PhedTanker?",
      answer: (
        <span>
          Users can generate detailed reports on bookings, completed trips, tanker
          utilization, and overall water distribution analytics for better decision-making.
        </span>
      ),
    },
  ],
};

export type SiteConfig = typeof siteConfig;
