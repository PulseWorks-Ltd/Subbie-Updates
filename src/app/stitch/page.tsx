import Link from "next/link";

const stitchPages = [
  { slug: "ai-summary-processing", label: "AI Summary Processing" },
  { slug: "billing-usage-management", label: "Billing & Usage Management" },
  { slug: "client-update-email-template", label: "Client Update Email Template" },
  { slug: "create-new-update", label: "Create New Update" },
  { slug: "create-your-account", label: "Create Your Account" },
  { slug: "login-to-subbie-updates", label: "Login to Subbie Updates" },
  { slug: "plan-limit-reached-upgrade", label: "Plan Limit Reached Upgrade" },
  { slug: "project-settings-recipients", label: "Project Settings & Recipients" },
  { slug: "public-client-update-page", label: "Public Client Update Page" },
  { slug: "recipient-limit-upgrade-prompt", label: "Recipient Limit Upgrade Prompt" },
  { slug: "review-edit-summary", label: "Review & Edit Summary" },
  { slug: "subscription-plans-selection", label: "Subscription Plans Selection" },
  { slug: "tradie-dashboard", label: "Tradie Dashboard" },
  { slug: "update-sent-success", label: "Update Sent Success" },
];

export default function StitchIndexPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Stitch Design Pages</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          These routes render the Stitch-exported designs.
        </p>
        <ul className="space-y-3">
          {stitchPages.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/stitch/${page.slug}`}
                className="block rounded-lg border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 px-4 py-3 hover:border-primary/50 hover:text-primary transition"
              >
                {page.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
