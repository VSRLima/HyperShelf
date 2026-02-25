import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div>
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              HypeShelf
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Collect and share the stuff you&apos;re hyped about
            </p>
          </Link>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-slate-800 border-slate-700",
              headerTitle: "text-white",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton:
                "bg-slate-700 hover:bg-slate-600 border-slate-600 text-white",
              dividerLine: "bg-slate-700",
              dividerText: "text-slate-400",
              formFieldInput: "bg-slate-700 border-slate-600 text-white",
              formFieldLabel: "text-slate-300",
              primaryButton: "bg-blue-600 hover:bg-blue-700",
              footerActionLink: "text-blue-400 hover:text-blue-300",
            },
          }}
        />
      </div>
    </div>
  );
}
