import { Check, X } from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import { FormField, Input, Select, Textarea } from "../../../components/common/Field";

const REJECTION_REASONS = [
  "Duplicate report",
  "Insufficient evidence",
  "Not a breeding site",
  "Out of jurisdiction",
];

const DETECTED_FACTORS = [
  "Stagnant water in container",
  "No cover on bucket",
];

export default function AIPrediction() {
  return (
    <>
      <PageHeader
        title="Prediction Review"
        description="Report DG-1042 · Submitted by Nimal Perera"
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded border border-border bg-slate-100 flex items-center justify-center aspect-[4/3]">
           <span className="text-muted-foreground text-sm">[ Image of suspected site ]</span>
        </div>

        <div className="space-y-6">
          <div className="rounded border border-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold border-b border-border pb-3 mb-4">Risk Assessment</h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Risk Level</span>
                <span className="font-semibold text-destructive">High Risk (Urgent)</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-semibold">87%</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-2">Detected Risk Factors</span>
                <ul className="list-disc pl-4 text-foreground">
                  {DETECTED_FACTORS.map(factor => <li key={factor}>{factor}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded border border-border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold border-b border-border pb-3">Accept Report</h3>
          <div className="space-y-4">
            <FormField label="Visit Date" htmlFor="visit-date">
              <Input id="visit-date" type="date" defaultValue="2026-07-26" />
            </FormField>
            <FormField label="Notes" htmlFor="accept-notes">
              <Textarea
                id="accept-notes"
                placeholder="Add notes for the citizen…"
                className="min-h-[100px]"
              />
            </FormField>
            <Button
              className="w-full"
              onClick={() => toast.success("Report accepted — visit scheduled")}
            >
              <Check className="h-4 w-4" /> Confirm Acceptance
            </Button>
          </div>
        </div>

        <div className="rounded border border-border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold border-b border-border pb-3">Reject Report</h3>
          <div className="space-y-4">
            <FormField label="Reason" htmlFor="reject-reason">
              <Select id="reject-reason" options={REJECTION_REASONS} />
            </FormField>
            <FormField label="Comments" htmlFor="reject-comments">
              <Textarea id="reject-comments" placeholder="Add comments…" className="min-h-[100px]" />
            </FormField>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => toast.error("Report rejected — citizen notified")}
            >
              <X className="h-4 w-4" /> Reject &amp; Notify Citizen
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
