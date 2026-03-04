"use client";

import { useMemo, useState } from "react";

type ApiResponse = {
  company_name: string;
  skills_json: string;
  mapping_json: string;
  cover_letter: string;
  word_count: number;
  disclaimer: string;
};

export default function Home() {
  const [resume, setResume] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [roleName, setRoleName] = useState("");

  const [jdMode, setJdMode] = useState<"text" | "link">("text");
  const [jobDescription, setJobDescription] = useState("");
  const [jdLink, setJdLink] = useState("");

  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "",
    []
  );

  async function handleGenerate() {
    setErr(null);

    if (!resume) return setErr("Upload a resume to continue.");
    if (!companyName.trim()) return setErr("Company name is required.");
    if (!roleName.trim()) return setErr("Role name is required.");
    if (jdMode === "text" && !jobDescription.trim())
      return setErr("Paste the job description to continue.");
    if (jdMode === "link" && !jdLink.trim())
      return setErr("Provide a job description link.");

    setLoading(true);

    try {
      const form = new FormData();
      form.append("resume_pdf", resume);
      form.append("company_name", companyName);
      form.append("role_name", roleName);
      form.append("tone", tone);
      form.append("length", length);

      if (jdMode === "text" && jobDescription.trim()) {
        form.append("job_description", jobDescription.trim());
      } else if (jdMode === "link" && jdLink.trim()) {
        form.append("job_description_url", jdLink.trim());
      }

      const res = await fetch(`${apiBase}/generate`, {
        method: "POST",
        body: form,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || "Request failed.");

      setData(json);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition";

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Header */}
        <div className="mb-14 animate-fade-in">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            CoverLetter Cutie
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            Generate a tailored cover letter from your resume and a job description.
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* LEFT — Form */}
          <div className="animate-fade-in space-y-5">
            {/* Resume */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Resume
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="resume-upload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
                >
                  Choose file
                </label>
                <span className="text-sm text-neutral-400 truncate max-w-[200px]">
                  {resume ? resume.name : "No file selected"}
                </span>
              </div>
            </div>

            {/* Company & Role */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Company
                </label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Amazon"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Role
                </label>
                <input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="SDE I"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-neutral-700">
                  Job Description
                </label>
                <div className="flex rounded-md border border-neutral-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setJdMode("text")}
                    className={`px-3 py-1 text-xs font-medium transition ${
                      jdMode === "text"
                        ? "bg-neutral-900 text-white"
                        : "bg-white text-neutral-500 hover:bg-neutral-50"
                    }`}
                  >
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setJdMode("link")}
                    className={`px-3 py-1 text-xs font-medium border-l border-neutral-200 transition ${
                      jdMode === "link"
                        ? "bg-neutral-900 text-white"
                        : "bg-white text-neutral-500 hover:bg-neutral-50"
                    }`}
                  >
                    Link
                  </button>
                </div>
              </div>

              {jdMode === "text" ? (
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className={`${inputClass} h-36 resize-none`}
                />
              ) : (
                <input
                  value={jdLink}
                  onChange={(e) => setJdLink(e.target.value)}
                  placeholder="https://company.jobs/role"
                  className={inputClass}
                />
              )}
            </div>

            {/* Tone & Length */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className={inputClass}
                >
                  <option value="professional">Professional</option>
                  <option value="concise">Concise</option>
                  <option value="friendly">Friendly</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Length
                </label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className={inputClass}
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>

            {/* Error */}
            {err && (
              <p className="text-sm text-red-600">{err}</p>
            )}

            {/* Generate */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 active:bg-neutral-950 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>

          {/* RIGHT — Output */}
          <div
            className="animate-fade-in lg:sticky lg:top-8"
            style={{ animationDelay: "0.08s" }}
          >
            {!data ? (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border border-dashed border-neutral-200">
                <p className="text-sm text-neutral-400">
                  Your cover letter will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-900">
                      Result
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {data.word_count} words &middot; {data.company_name}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(data.cover_letter)}
                    className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="max-h-[380px] overflow-y-auto rounded-lg border border-neutral-200 p-5 text-sm leading-relaxed text-neutral-700">
                  {data.cover_letter.split("\n\n").map((p, i) => (
                    <p key={i} className="mb-4 last:mb-0">
                      {p}
                    </p>
                  ))}
                </div>

                <p className="text-xs text-neutral-400">
                  {data.disclaimer}
                </p>

                <details className="text-xs">
                  <summary className="cursor-pointer font-medium text-neutral-500 hover:text-neutral-700 transition">
                    Model reasoning
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-neutral-50 border border-neutral-100 p-4 text-neutral-600">
Skills JSON:
{data.skills_json}

Mapping JSON:
{data.mapping_json}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
