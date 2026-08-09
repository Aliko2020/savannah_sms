import { Input } from './ui/Input';
import { formatName } from '../utils/format';
import type { ScoreRoster } from '../types';

export interface ScoreDraft {
  classScore: string;
  examScore: string;
}

interface ScoreEntryTableProps {
  roster: ScoreRoster;
  drafts: Record<string, ScoreDraft>;
  onChange: (studentId: string, field: 'classScore' | 'examScore', value: string) => void;
}

export function ScoreEntryTable({ roster, drafts, onChange }: ScoreEntryTableProps) {
  if (roster.students.length === 0) {
    return <p className="px-6 py-8 text-center text-sm text-zinc-500">No students enrolled in this class yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
          <tr>
            <th className="px-6 py-3 font-semibold">#</th>
            <th className="px-6 py-3 font-semibold">Admission No.</th>
            <th className="px-6 py-3 font-semibold">Student Name</th>
            <th className="px-6 py-3 font-semibold">Class Mark [40%]</th>
            <th className="px-6 py-3 font-semibold">Exam Mark [60%]</th>
            <th className="px-6 py-3 font-semibold">Total [100%]</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {roster.students.map((s, index) => {
            const draft = drafts[s.studentId] ?? { classScore: '', examScore: '' };
            const classVal = draft.classScore === '' ? null : Number(draft.classScore);
            const examVal = draft.examScore === '' ? null : Number(draft.examScore);
            const total = classVal !== null || examVal !== null ? (classVal ?? 0) * 0.4 + (examVal ?? 0) * 0.6 : null;

            return (
              <tr key={s.studentId}>
                <td className="px-6 py-3 tabular-nums text-zinc-400">{index + 1}</td>
                <td className="px-6 py-3 text-zinc-500">{s.admissionNumber}</td>
                <td className="px-6 py-3 font-medium text-zinc-900">{formatName(s.firstName, s.lastName)}</td>
                <td className="px-6 py-3">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    fieldSize="sm"
                    containerClassName="w-20"
                    value={draft.classScore}
                    onChange={(e) => onChange(s.studentId, 'classScore', e.target.value)}
                  />
                </td>
                <td className="px-6 py-3">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    fieldSize="sm"
                    containerClassName="w-20"
                    value={draft.examScore}
                    onChange={(e) => onChange(s.studentId, 'examScore', e.target.value)}
                  />
                </td>
                <td className="px-6 py-3 font-medium tabular-nums text-zinc-700">
                  {total !== null ? Math.round(total * 100) / 100 : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
