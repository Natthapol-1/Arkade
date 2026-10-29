import { notFound, redirect } from 'next/navigation';
import RubyStarGame from '../../RubyStarGame';
import { findTrial } from '../../trials';

// A challenge world. Locked (not yet built) challenges send you back to the star map.
export default async function CelestialTrialPage({ params }: { params: Promise<{ body: string }> }) {
  const { body } = await params;
  const trial = findTrial(body);
  if (!trial) notFound();
  if (!trial.ready) redirect('/ruby-star/challenge');
  return <RubyStarGame mode="trial" trialId={trial.id} />;
}
