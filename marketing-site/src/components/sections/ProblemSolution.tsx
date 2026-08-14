import { Container } from '../ui/Container';
import { Eyebrow } from '../ui/Badge';
import { problemSolutionRows } from '../../data/content';

export function ProblemSolution() {
  return (
    <section className="border-y border-paper/10 py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Why Edusavannah</Eyebrow>
          <h2 className="text-3xl font-bold text-paper sm:text-4xl">The problem. And the fix.</h2>
          <p className="mt-4 text-paper-muted">
            Three groups Northern Ghana's digital divide holds back most — and how we close the gap for each.
          </p>
        </div>

        <div className="mt-14 overflow-x-auto rounded-2xl border border-paper/10">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-paper/10 bg-ink-raised text-xs font-semibold uppercase tracking-wide text-paper-dim">
                <th className="px-6 py-4">Sector</th>
                <th className="px-6 py-4">The Problem</th>
                <th className="px-6 py-4">The Edusavannah Solution</th>
              </tr>
            </thead>
            <tbody>
              {problemSolutionRows.map((row) => (
                <tr key={row.sector} className="border-b border-paper/10 last:border-0">
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <row.icon className="size-4" aria-hidden />
                      </span>
                      <span className="font-semibold text-paper">{row.sector}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top text-paper-muted">{row.problem}</td>
                  <td className="px-6 py-5 align-top text-paper-muted">{row.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}
