import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Plus, Receipt } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { apiFetch, ApiError } from "../api/client";
import { CLASS_CATEGORIES, CLASS_CATEGORY_LABELS } from "../constants";
import { formatCurrency } from "../utils/format";
import type { AcademicYear, ClassCategory, FeeStructureItem, Term } from "../types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function FeeSetupPage() {
  const queryClient = useQueryClient();

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => apiFetch<AcademicYear[]>("/academic-years"),
  });

  const [academicYearId, setAcademicYearId] = useState("");
  useEffect(() => {
    if (!academicYearId && academicYears && academicYears.length > 0) {
      setAcademicYearId(
        academicYears.find((y) => y.isCurrent)?.id ?? academicYears[0].id,
      );
    }
  }, [academicYears, academicYearId]);

  const { data: terms } = useQuery({
    queryKey: ["terms", academicYearId],
    queryFn: () => apiFetch<Term[]>(`/terms?academicYearId=${academicYearId}`),
    enabled: !!academicYearId,
  });

  const [termId, setTermId] = useState("");
  useEffect(() => {
    setTermId("");
  }, [academicYearId]);
  useEffect(() => {
    if (!termId && terms && terms.length > 0) {
      setTermId(terms.find((t) => t.isCurrent)?.id ?? terms[0].id);
    }
  }, [terms, termId]);

  const { data: structures } = useQuery({
    queryKey: ["fee-structures"],
    queryFn: () => apiFetch<FeeStructureItem[]>("/fees/structures"),
  });

  const [showForm, setShowForm] = useState(false);

  const [amounts, setAmounts] = useState<Record<ClassCategory, string>>({
    PRE_SCHOOL: "",
    PRIMARY: "",
    JHS: "",
  });

  useEffect(() => {
    if (!termId) return;
    const forTerm = structures?.filter((s) => s.termId === termId) ?? [];
    setAmounts({
      PRE_SCHOOL:
        forTerm.find((s) => s.category === "PRE_SCHOOL")?.amount.toString() ??
        "",
      PRIMARY:
        forTerm.find((s) => s.category === "PRIMARY")?.amount.toString() ?? "",
      JHS: forTerm.find((s) => s.category === "JHS")?.amount.toString() ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termId, structures]);

  const saveStructures = useMutation({
    mutationFn: async () => {
      const entries = CLASS_CATEGORIES.filter((c) => amounts[c] !== "");
      await Promise.all(
        entries.map((category) =>
          apiFetch("/fees/structures", {
            method: "PUT",
            body: JSON.stringify({
              category,
              termId,
              amount: Number(amounts[category]),
            }),
          }),
        ),
      );
    },
    onSuccess: () => {
      toast.success("Fee amounts saved.");
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
      setShowForm(false);
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not save fee amounts.")),
  });

  const yearName = (id: string) =>
    academicYears?.find((y) => y.id === id)?.name ?? "Unknown";

  const termOptions = (terms ?? []).map((t) => ({
    value: t.id,
    label: t.isCurrent ? `${t.name} (Active)` : t.name,
  }));

  return (
    <DashboardLayout title="Fee Setup" icon={Receipt}>
      <div className="mb-6 max-w-2xl overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          All Configured Fees
        </div>
        {(!structures || structures.length === 0) && (
          <p className="px-6 py-8 text-center text-sm text-zinc-500">
            No fee amounts configured yet.
          </p>
        )}
        {structures && structures.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
              <tr>
                <th className="px-6 py-3 font-semibold">Academic Year</th>
                <th className="px-6 py-3 font-semibold">Term</th>
                <th className="px-6 py-3 font-semibold">Category</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {structures
                .slice()
                .sort(
                  (a, b) =>
                    yearName(a.academicYearId).localeCompare(yearName(b.academicYearId)) ||
                    a.termName.localeCompare(b.termName),
                )
                .map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-zinc-50">
                    <td className="px-6 py-3 text-zinc-900">
                      {yearName(s.academicYearId)}
                    </td>
                    <td className="px-6 py-3 text-zinc-500">{s.termName}</td>
                    <td className="px-6 py-3 text-zinc-500">
                      {CLASS_CATEGORY_LABELS[s.category]}
                    </td>
                    <td className="px-6 py-3 font-medium tabular-nums text-zinc-900">
                      {formatCurrency(s.amount)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {!showForm && (
        <Button onClick={() => setShowForm(true)}>
          <Plus /> Set Fee Amounts
        </Button>
      )}

      {showForm && (
        <div className="max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Academic Year"
              value={academicYearId}
              onValueChange={setAcademicYearId}
              options={(academicYears ?? []).map((y) => ({ value: y.id, label: y.name }))}
            />
            <Select
              label="Term"
              value={termId}
              onValueChange={setTermId}
              options={termOptions}
              disabled={!terms || terms.length === 0}
              hint={terms && terms.length === 0 ? "No terms have been set up yet." : undefined}
            />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveStructures.mutate();
            }}
            className="space-y-4"
          >
            {CLASS_CATEGORIES.map((category) => (
              <Input
                key={category}
                type="number"
                min="0"
                step="0.01"
                label={`${CLASS_CATEGORY_LABELS[category]} fee (GHS) — per term`}
                value={amounts[category]}
                onChange={(e) =>
                  setAmounts({ ...amounts, [category]: e.target.value })
                }
                placeholder="Not set"
              />
            ))}

            <div className="flex gap-2">
              <Button type="submit" loading={saveStructures.isPending} disabled={!termId}>
                Save
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
