export default function EmployeeHelpPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Help & Tips</h2>
      <p className="mt-1 text-sm text-slate-600">
        Use this page for quick guidance before creating a leave request.
      </p>

      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Suggested prompts</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>How many leaves are left for my account?</li>
            <li>I need 2 sick leaves next week.</li>
            <li>What does the policy say about casual leave notice?</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Best practice</h3>
          <p className="mt-2 text-sm text-slate-700">
            Include date range, leave type, and reason in your chat prompt. This helps the assistant
            generate accurate recommendations and speeds HR approvals.
          </p>
        </div>
      </div>
    </div>
  );
}
