type ParticleBoost = {
	from: number
	peak: number
	startedAt: number
	endsAt: number
}

export const createParticleBoost = (): ParticleBoost => ({
	from: 1,
	peak: 1,
	startedAt: 0,
	endsAt: 0,
})

const smooth = (progress: number) => progress * progress * (3 - 2 * progress)

export function getParticleSpeed(boost: ParticleBoost, now: number) {
	if (now >= boost.endsAt) return 1
	if (now < boost.startedAt + 180) {
		return (
			boost.from +
			(boost.peak - boost.from) *
				smooth(Math.max(0, (now - boost.startedAt) / 180))
		)
	}
	if (now > boost.endsAt - 450) {
		return 1 + (boost.peak - 1) * smooth((boost.endsAt - now) / 450)
	}
	return boost.peak
}

export function boostParticles(
	boost: ParticleBoost,
	double: boolean,
	now: number,
) {
	// Repeated clicks extend the effect, but never stack into unbounded speed.
	boost.from = getParticleSpeed(boost, now)
	boost.peak = Math.max(double ? 6 : 3, now < boost.endsAt ? boost.peak : 1)
	boost.startedAt = now
	boost.endsAt = now + 2000
}
