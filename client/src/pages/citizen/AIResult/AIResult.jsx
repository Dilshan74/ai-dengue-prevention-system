import { Eye } from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";

const DETECTED_FACTORS = [
  "Stagnant water in container",
  "No cover on bucket",
];

export default function AIResult() {
  return (
    <>
      <PageHeader title="Analysis Result" description="Report DG-1042" />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded border border-border bg-slate-100 flex items-center justify-center p-8 aspect-video">
           <span className="text-muted-foreground text-sm">[ Image of suspected site ]</span>
        </div>

        <div className="space-y-6">
          <div className="rounded border border-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold border-b border-border pb-3 mb-4">Risk Assessment</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Risk Level</span>
                <span className="font-semibold text-destructive">High</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-semibold">87%</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-2">Detected Risk Factors</span>
                <ul className="list-disc pl-4 text-sm text-foreground">
                  {DETECTED_FACTORS.map(factor => <li key={factor}>{factor}</li>)}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="rounded border border-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold border-b border-border pb-3 mb-4">Recommendation</h3>
            <p className="text-sm text-foreground">
              Immediate inspection required. Please empty the container to prevent mosquito breeding.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => toast.success("Sent to PHI for review")}>
          <Eye className="h-4 w-4" /> Send to PHI for Review
        </Button>
        <Button variant="outline" onClick={() => toast.success("Report downloaded")}>
          Download Report
        </Button>
      </div>
    </>
  );
}
