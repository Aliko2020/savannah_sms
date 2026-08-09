import { GRADE_INTERPRETATION } from '../constants';
import { formatName, titleCase } from '../utils/format';
import type { SchoolSettings, StudentReportCard } from '../types';

function two(n: number | null): string {
  return n !== null ? n.toFixed(2) : '—';
}

export function ReportCardDocument({ report, school }: { report: StudentReportCard; school: SchoolSettings }) {
  return (
    <div className="mx-auto max-w-4xl border border-black bg-white p-8 text-black print:border-0 print:p-0">
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold uppercase tracking-wide">{school.name}</h1>
        <p className="text-sm">{school.address}</p>
        <p className="text-sm">{school.phone}</p>
        <h2 className="mt-3 text-base font-bold uppercase underline">Student Termly Report</h2>
      </div>

      <table className="mb-4 w-full border-collapse border border-black text-sm">
        <tbody>
          <tr>
            <ReportInfoCell label="Student ID" value={report.student.admissionNumber} />
            <ReportInfoCell label="Term" value={report.term.name} />
            <ReportInfoCell
              label="Gender"
              value={report.student.gender === 'MALE' ? 'Male' : report.student.gender === 'FEMALE' ? 'Female' : '—'}
            />
          </tr>
          <tr>
            <ReportInfoCell
              label="Name"
              value={formatName(report.student.firstName, report.student.lastName).toUpperCase()}
            />
            <ReportInfoCell label="Academic Year" value={report.academicYear.name} />
            <ReportInfoCell label="Average Score" value={two(report.averageScore)} />
          </tr>
          <tr>
            <ReportInfoCell label="Class" value={titleCase(report.class.name)} />
            <ReportInfoCell label="No. On Roll" value={String(report.noOnRoll)} />
            <ReportInfoCell label="Position In Class" value={report.positionInClass ?? '—'} />
          </tr>
          <tr>
            <ReportInfoCell
              label="Next Term Begin"
              value={report.nextTermBeginDate ? new Date(report.nextTermBeginDate).toLocaleDateString() : '—'}
            />
            <ReportInfoCell label=" " value=" " />
            <ReportInfoCell label="Cum Avg" value={two(report.cumulativeAverage)} />
          </tr>
        </tbody>
      </table>

      <table className="mb-4 w-full border-collapse border border-black text-sm">
        <thead>
          <tr>
            <th rowSpan={2} className="border border-black px-2 py-1 text-left align-bottom">
              Subjects
            </th>
            <th className="border border-black px-2 py-1">Class Score</th>
            <th className="border border-black px-2 py-1">Exams Score</th>
            <th className="border border-black px-2 py-1">Total Score</th>
            <th rowSpan={2} className="border border-black px-2 py-1 align-bottom">
              Position
            </th>
            <th rowSpan={2} className="border border-black px-2 py-1 align-bottom">
              Remark
            </th>
            <th rowSpan={2} className="border border-black px-2 py-1 align-bottom">
              Subject Teacher
            </th>
          </tr>
          <tr>
            <th className="border border-black px-2 py-1 font-normal">40%</th>
            <th className="border border-black px-2 py-1 font-normal">60%</th>
            <th className="border border-black px-2 py-1 font-normal">100%</th>
          </tr>
        </thead>
        <tbody>
          {report.subjects.map((s) => (
            <tr key={s.subjectName}>
              <td className="border border-black px-2 py-1">{s.subjectName}</td>
              <td className="border border-black px-2 py-1 text-center tabular-nums">{s.classScore ?? '—'}</td>
              <td className="border border-black px-2 py-1 text-center tabular-nums">{s.examScore ?? '—'}</td>
              <td className="border border-black px-2 py-1 text-center tabular-nums">{s.total ?? '—'}</td>
              <td className="border border-black px-2 py-1 text-center">{s.position ?? '—'}</td>
              <td className="border border-black px-2 py-1 text-center">{s.remark ?? '—'}</td>
              <td className="border border-black px-2 py-1 text-center">
                {s.teacherFirstName && s.teacherLastName ? formatName(s.teacherFirstName, s.teacherLastName) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="mb-4 w-full border-collapse border border-black text-sm">
        <tbody>
          <tr>
            <td className="border border-black px-2 py-1">Attendance</td>
            <td className="border border-black px-2 py-1">&nbsp;</td>
            <td className="border border-black px-2 py-1">Out Of</td>
            <td className="border border-black px-2 py-1">&nbsp;</td>
            {report.isFinalTerm && (
              <>
                <td className="border border-black px-2 py-1">Promoted To</td>
                <td className="border border-black px-2 py-1">.......................................................</td>
              </>
            )}
          </tr>
        </tbody>
      </table>

      <div className="space-y-3 text-sm">
        <p>Student Conduct/Interest: ....................................................................................................................................................</p>
        <p>Class Teacher&rsquo;s Remark: .....................................................................................................................................................</p>
        <p>Head Teacher&rsquo;s Signature: ..................................................................................................................................................</p>
      </div>

      <p className="mt-4 text-xs">
        <span className="font-semibold">GRADE INTERPRETATION:</span> {GRADE_INTERPRETATION}
      </p>
    </div>
  );
}

function ReportInfoCell({ label, value }: { label: string; value: string }) {
  return (
    <>
      <td className="border border-black bg-zinc-100 px-2 py-1 font-semibold print:bg-transparent">{label}</td>
      <td className="border border-black px-2 py-1">{value}</td>
    </>
  );
}
