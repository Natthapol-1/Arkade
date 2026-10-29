import { notFound } from 'next/navigation';
import RubyStarGame from '../../RubyStarGame';
import { findTrial } from '../../trials';

// Prototype challenge: stage 0 with only the guardian boss and its recharging celestial skill.
export default async function CelestialTrialPage({ params }: { params: Promise<{ body: string }> }) {
  const { body } = await params;
  const trial = findTrial(body);
  if (!trial) notFound();
  return <RubyStarGame mode="trial" trialId={trial.id} />;
}
