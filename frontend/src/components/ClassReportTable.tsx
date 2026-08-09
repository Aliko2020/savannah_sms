import { formatName } from '../utils/format';
import type { ClassReport } from '../types';

export function ClassReportTable({ report }: { report: ClassReport }) {
  if (report.subjects.length === 0) {
    return (
      <p className="px-6 py-8 text-center text-sm text-zinc-500">No subjects have been entered for this class yet.</p>
    );
  }

  if (report.students.length === 0) {
    return <p className="px-6 py-8 text-center text-sm text-zinc-500">No students enrolled in this class yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wide text-zinc-400">
          <tr className="border-b border-border bg-zinc-50">
            <th rowSpan={2} className="px-6 py-3 align-bottom font-semibold">
              Number
            </th>
            <th rowSpan={2} className="px-6 py-3 align-bottom font-semibold">
              Name
            </th>
            <th colSpan={report.subjects.length} className="px-6 py-2 text-center font-semibold">
              Subjects
            </th>
          </tr>
          <tr className="border-b border-border">
            {report.subjects.map((s) => (
              <th key={s.classSubjectId} className="px-6 py-3 text-center text-xs font-semibold text-zinc-700">
                {s.subjectName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {report.students.map((s) => (
            <tr key={s.studentId} className="transition-colors hover:bg-zinc-50">
              <td className="px-6 py-3 text-zinc-700">{s.admissionNumber}</td>
              <td className="px-6 py-3 text-zinc-700">{formatName(s.firstName, s.lastName)}</td>
              {report.subjects.map((subj) => {
                const score = s.scores[subj.classSubjectId];
                return (
                  <td key={subj.classSubjectId} className="px-6 py-3 text-center tabular-nums text-zinc-700">
                    {score !== null ? Math.round(score * 100) / 100 : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
