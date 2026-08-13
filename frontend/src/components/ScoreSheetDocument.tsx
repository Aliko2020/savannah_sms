import { formatName } from '../utils/format';
import type { ClassStudent, SchoolSettings } from '../types';

interface ScoreSheetDocumentProps {
  title: string;
  academicYearName: string;
  className: string;
  termName: string;
  students: ClassStudent[];
  school: SchoolSettings;
}

// A blank, print-only mark sheet — teachers fill in scores by hand from
// this printout, then a staff member types the finished totals into the
// system afterwards (via Grade Entry). No score data is read or written
// here; it only prints the roster and blank columns to write into.
export function ScoreSheetDocument({ title, academicYearName, className, termName, students, school }: ScoreSheetDocumentProps) {
  return (
    <div className="mx-auto max-w-4xl border border-black bg-white p-8 text-black print:border-0 print:p-0">
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold uppercase tracking-wide">{school.name}</h1>
        <p className="text-sm">{school.address}</p>
        <p className="text-sm">{school.phone}</p>
        <h2 className="mt-3 text-base font-bold uppercase underline">{title}</h2>
      </div>

      <table className="mb-2 w-full border-collapse border border-black text-sm">
        <tbody>
          <tr>
            <td className="w-1/4 border border-black bg-zinc-100 px-2 py-1 font-semibold print:bg-transparent">
              Academic Year
            </td>
            <td className="border border-black px-2 py-1">{academicYearName}</td>
          </tr>
          <tr>
            <td className="border border-black bg-zinc-100 px-2 py-1 font-semibold print:bg-transparent">Class</td>
            <td className="border border-black px-2 py-1">{className}</td>
          </tr>
          <tr>
            <td className="border border-black bg-zinc-100 px-2 py-1 font-semibold print:bg-transparent">Term</td>
            <td className="border border-black px-2 py-1">{termName}</td>
          </tr>
          <tr>
            <td className="border border-black bg-zinc-100 px-2 py-1 font-semibold print:bg-transparent">
              Subject Title
            </td>
            <td className="border border-black px-2 py-1">.............................................</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-black text-sm">
        <thead>
          <tr>
            <th rowSpan={2} className="border border-black px-2 py-1 align-bottom">
              S/N
            </th>
            <th rowSpan={2} className="border border-black px-2 py-1 align-bottom">
              Student ID
            </th>
            <th rowSpan={2} className="border border-black px-2 py-1 text-left align-bottom">
              Student Name
            </th>
            <th colSpan={4} className="border border-black px-2 py-1">
              Class Score — 40% of Total
            </th>
            <th className="border border-black px-2 py-1">
              Exams Score — 60% of Total
            </th>
          </tr>
          <tr>
            <th className="border border-black px-2 py-1 font-normal">10</th>
            <th className="border border-black px-2 py-1 font-normal">10</th>
            <th className="border border-black px-2 py-1 font-normal">10</th>
            <th className="border border-black px-2 py-1 font-normal">10</th>
            <th className="border border-black px-2 py-1 font-normal">Out of 100</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, index) => (
            <tr key={s.id}>
              <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
              <td className="border border-black px-2 py-2">{s.admissionNumber}</td>
              <td className="border border-black px-2 py-2">{formatName(s.firstName, s.lastName)}</td>
              <td className="border border-black px-2 py-2">&nbsp;</td>
              <td className="border border-black px-2 py-2">&nbsp;</td>
              <td className="border border-black px-2 py-2">&nbsp;</td>
              <td className="border border-black px-2 py-2">&nbsp;</td>
              <td className="border border-black px-2 py-2">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
