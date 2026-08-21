import { Container } from '../ui/Container';
import { Eyebrow } from '../ui/Badge';
import { Placeholder } from '../ui/Placeholder';
import type { CourseTrack } from '../../data/content';

export function CourseCatalog({ tracks }: { tracks: CourseTrack[] }) {
  return (
    <section className="py-20">
      <Container>
        <Eyebrow>Course Catalog</Eyebrow>
        <h2 className="mb-10 text-3xl font-bold text-paper">What you'll learn</h2>

        <div className="overflow-x-auto rounded-2xl border border-paper/10">
          <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-paper/10 bg-ink-raised text-xs font-semibold uppercase tracking-wide text-paper-dim">
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Core Modules</th>
                <th className="px-6 py-4">Target Audience</th>
                <th className="px-6 py-4">Duration</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track.track} className="border-b border-paper/10 last:border-0">
                  <td className="px-6 py-5 font-semibold text-paper">{track.track}</td>
                  <td className="px-6 py-5 text-paper-muted">{track.modules}</td>
                  <td className="px-6 py-5 text-paper-muted">
                    {track.audienceConfirmed ? track.targetAudience : <Placeholder>{track.targetAudience}</Placeholder>}
                  </td>
                  <td className="px-6 py-5 text-paper-muted">
                    {track.durationConfirmed ? track.duration : <Placeholder>{track.duration}</Placeholder>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}
