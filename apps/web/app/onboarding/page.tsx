import { redirect } from 'next/navigation';


// Main onboarding entry - redirects to the first step (welcome)
export default function OnboardingPage() {
  redirect('/onboarding/welcome');
}
