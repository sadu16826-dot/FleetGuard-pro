import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { CtaSection, DashboardSection, FeaturesSection, ProblemSection, SecuritySection, SolutionsSection, TrustSection, WorkflowSection } from "@/components/sections/landing-sections";
import { Footer } from "@/components/sections/footer";

export default function HomePage() {
  return <><Navbar/><main><Hero/><TrustSection/><ProblemSection/><SolutionsSection/><FeaturesSection/><WorkflowSection/><DashboardSection/><SecuritySection/><CtaSection/></main><Footer/></>;
}
