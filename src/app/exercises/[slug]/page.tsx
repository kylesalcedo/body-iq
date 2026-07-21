import { notFound } from "next/navigation";
import { getExercise } from "@/lib/queries";
import { StatusBadge, ConfidenceBadge, RoleBadge } from "@/components/badges";
import { EntityLink, PageHeader, Card, SectionTitle, EmptyState } from "@/components/ui-helpers";

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const colors: Record<string, string> = {
    strength: "bg-rose-100 text-rose-800",
    stretch: "bg-teal-100 text-teal-800",
    mobility: "bg-cyan-100 text-cyan-800",
    balance: "bg-violet-100 text-violet-800",
    "motor-control": "bg-indigo-100 text-indigo-800",
    breathwork: "bg-sky-100 text-sky-800",
    aerobic: "bg-orange-100 text-orange-800",
    sensory: "bg-fuchsia-100 text-fuchsia-800",
    functional: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[category] || "bg-gray-100 text-gray-800"}`}>
      {category}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string | null }) {
  if (!difficulty) return null;
  const colors: Record<string, string> = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-yellow-100 text-yellow-800",
    advanced: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[difficulty] || "bg-gray-100 text-gray-800"}`}>
      {difficulty}
    </span>
  );
}

function EvidenceBadge({ level }: { level: string | null }) {
  if (!level) return null;
  const colors: Record<string, string> = {
    strong: "bg-emerald-100 text-emerald-800",
    moderate: "bg-blue-100 text-blue-800",
    limited: "bg-amber-100 text-amber-800",
    "expert-opinion": "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[level] || "bg-gray-100 text-gray-800"}`}>
      ⬤ {level} evidence
    </span>
  );
}

function QualityScore({ score, breakdown }: { score: number | null; breakdown: any }) {
  if (score == null) return null;
  const band =
    score >= 85 ? "bg-emerald-100 text-emerald-800 border-emerald-200"
    : score >= 70 ? "bg-blue-100 text-blue-800 border-blue-200"
    : score >= 60 ? "bg-amber-100 text-amber-800 border-amber-200"
    : "bg-red-100 text-red-800 border-red-200";
  const dims: { key: string; label: string; max: number }[] = [
    { key: "evidence", label: "Evidence", max: 30 },
    { key: "coherence", label: "Coherence", max: 30 },
    { key: "completeness", label: "Completeness", max: 25 },
    { key: "rigor", label: "Review rigor", max: 15 },
  ];
  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between">
        <SectionTitle>Quality Score</SectionTitle>
        <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-bold ${band}`}>{score}/100</span>
      </div>
      <p className="mt-1 mb-3 text-xs text-gray-500">Composite of four validators. Higher intrinsic dimensions plus human review raise the score.</p>
      <div className="space-y-2">
        {dims.map((d) => {
          const dim = breakdown?.[d.key];
          if (!dim) return null;
          const pct = Math.round((dim.score / d.max) * 100);
          return (
            <div key={d.key}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">{d.label}</span>
                <span className="tabular-nums text-gray-500">{dim.score}/{d.max}</span>
              </div>
              <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-100">
                <div className={`h-1.5 rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 55 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
              </div>
              {dim.notes?.length > 0 && (
                <p className="mt-0.5 text-[11px] text-gray-400">{dim.notes.join(" · ")}</p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default async function ExerciseDetailPage({ params }: { params: { slug: string } }) {
  const exercise = await getExercise(params.slug);
  if (!exercise) notFound();

  // Separate muscles by role for better display
  const primaryMuscles = exercise.muscles.filter(m => m.role === "primary");
  const secondaryMuscles = exercise.muscles.filter(m => m.role === "secondary");
  const stabilizerMuscles = exercise.muscles.filter(m => m.role === "stabilizer");
  const lengtheningMuscles = exercise.muscles.filter(m => m.role === "lengthening");
  const otherMuscles = exercise.muscles.filter(m => !["primary", "secondary", "stabilizer", "lengthening"].includes(m.role));

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={exercise.name}
        badges={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={exercise.status} />
            <CategoryBadge category={(exercise as any).category} />
            <ConfidenceBadge confidence={exercise.confidence} />
            <DifficultyBadge difficulty={(exercise as any).difficulty} />
            <EvidenceBadge level={(exercise as any).evidenceLevel} />
          </div>
        }
      />

      <QualityScore score={(exercise as any).qualityScore} breakdown={(exercise as any).scoreBreakdown} />

      <div className="mb-6 flex items-center gap-2">
        <a
          href={`/api/exercises/${exercise.slug}/fhir`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100 transition-colors"
        >
          <span aria-hidden>⚕</span> View FHIR resource
        </a>
        <span className="text-xs text-gray-400">FHIR R4 ActivityDefinition — the interoperable form of this exercise</span>
      </div>

      {/* Why include it — clinical rationale */}
      {(exercise as any).rationale && (
        <Card className="mb-6 border-l-4 border-l-teal-500">
          <SectionTitle>Why Include This</SectionTitle>
          <p className="text-sm text-gray-700 leading-relaxed">{(exercise as any).rationale}</p>
          {(exercise as any).evidenceLevel && (
            <p className="mt-2 text-xs text-gray-400">Evidence basis: {(exercise as any).evidenceLevel}</p>
          )}
        </Card>
      )}

      {/* Structured positions */}
      {((exercise as any).startPosition || (exercise as any).endPosition || (exercise as any).rom) && (
        <Card className="mb-6">
          <SectionTitle>Positions & Range of Motion</SectionTitle>
          <dl className="grid gap-3 sm:grid-cols-3">
            {(exercise as any).startPosition && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Start</dt>
                <dd className="mt-0.5 text-sm text-gray-700">{(exercise as any).startPosition}</dd>
              </div>
            )}
            {(exercise as any).endPosition && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">End</dt>
                <dd className="mt-0.5 text-sm text-gray-700">{(exercise as any).endPosition}</dd>
              </div>
            )}
            {(exercise as any).rom && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Range of Motion</dt>
                <dd className="mt-0.5 text-sm text-gray-700">{(exercise as any).rom}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {/* Description & How To */}
      <Card className="mb-6">
        <SectionTitle>How to Perform</SectionTitle>
        <p className="text-sm text-gray-700 leading-relaxed">{exercise.description}</p>

        {/* Watch on YouTube — search by exercise name */}
        <div className="mt-4">
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + " exercise")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:border-red-300 hover:bg-red-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.546 15.568V8.432L15.818 12l-6.272 3.568z" />
            </svg>
            Watch on YouTube
            <span className="text-red-400">↗</span>
          </a>
          <p className="mt-1 text-[11px] text-gray-400">
            Opens a YouTube search for &ldquo;{exercise.name}&rdquo;
          </p>
        </div>

        {/* Equipment */}
        {(exercise as any).equipment?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-xs text-gray-500 mr-1">Equipment:</span>
            {(exercise as any).equipment.map((e: string) => (
              <span key={e} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                {e.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        )}

        {/* Body Position */}
        {(exercise as any).bodyPosition && (
          <div className="mt-2">
            <span className="text-xs text-gray-500">Starting position: </span>
            <span className="text-xs text-gray-700 font-medium">{(exercise as any).bodyPosition}</span>
          </div>
        )}
      </Card>

      {/* Coaching Cues - prominent for open-source users */}
      {exercise.cues.length > 0 && (
        <Card className="mb-6 border-l-4 border-l-blue-400">
          <SectionTitle>Coaching Cues</SectionTitle>
          <ol className="space-y-3">
            {exercise.cues.map((c, i) => (
              <li key={c.id} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm text-gray-800">{c.text}</p>
                  {c.cueType && (
                    <span className="text-xs text-gray-400 mt-0.5">({c.cueType})</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Dosing - when available */}
      {((exercise as any).dosing || (exercise as any).emgNotes) && (
        <Card className="mb-6 bg-emerald-50 border-emerald-200">
          <SectionTitle>Evidence-Based Dosing & EMG Data</SectionTitle>
          {(exercise as any).dosing && (
            <div className="mb-3">
              <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Recommended Dosing</span>
              <p className="text-sm text-gray-700 mt-1">{(exercise as any).dosing}</p>
            </div>
          )}
          {(exercise as any).emgNotes && (
            <div>
              <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">EMG Activation Data</span>
              <p className="text-sm text-gray-700 mt-1">{(exercise as any).emgNotes}</p>
            </div>
          )}
        </Card>
      )}

      {/* Muscle Roles - grouped by role */}
      <Card className="mb-6">
        <SectionTitle>Muscles Involved ({exercise.muscles.length})</SectionTitle>
        {exercise.muscles.length === 0 ? (
          <EmptyState message="No muscles linked." />
        ) : (
          <div className="space-y-4">
            {primaryMuscles.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Primary Movers</h4>
                <div className="space-y-1">
                  {primaryMuscles.map((em) => (
                    <div key={em.id} className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2">
                      <EntityLink href={`/muscles/${em.muscle.slug}`} className="font-medium text-sm">
                        {em.muscle.name}
                      </EntityLink>
                      {em.notes && <span className="text-xs text-gray-500 mt-0.5">— {em.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {secondaryMuscles.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Secondary Movers</h4>
                <div className="space-y-1">
                  {secondaryMuscles.map((em) => (
                    <div key={em.id} className="flex items-start gap-2 rounded-md bg-orange-50 px-3 py-2">
                      <EntityLink href={`/muscles/${em.muscle.slug}`} className="font-medium text-sm">
                        {em.muscle.name}
                      </EntityLink>
                      {em.notes && <span className="text-xs text-gray-500 mt-0.5">— {em.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stabilizerMuscles.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Stabilizers</h4>
                <div className="space-y-1">
                  {stabilizerMuscles.map((em) => (
                    <div key={em.id} className="flex items-start gap-2 rounded-md bg-blue-50 px-3 py-2">
                      <EntityLink href={`/muscles/${em.muscle.slug}`} className="font-medium text-sm">
                        {em.muscle.name}
                      </EntityLink>
                      {em.notes && <span className="text-xs text-gray-500 mt-0.5">— {em.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lengtheningMuscles.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">Lengthened / Stretched</h4>
                <div className="space-y-1">
                  {lengtheningMuscles.map((em) => (
                    <div key={em.id} className="flex items-start gap-2 rounded-md bg-teal-50 px-3 py-2">
                      <EntityLink href={`/muscles/${em.muscle.slug}`} className="font-medium text-sm">
                        {em.muscle.name}
                      </EntityLink>
                      {em.notes && <span className="text-xs text-gray-500 mt-0.5">— {em.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {otherMuscles.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Synergists & Assistors</h4>
                <div className="space-y-1">
                  {otherMuscles.map((em) => (
                    <div key={em.id} className="flex items-start gap-2 rounded-md bg-purple-50 px-3 py-2">
                      <EntityLink href={`/muscles/${em.muscle.slug}`} className="font-medium text-sm">
                        {em.muscle.name}
                      </EntityLink>
                      <RoleBadge role={em.role} />
                      {em.notes && <span className="text-xs text-gray-500 mt-0.5">— {em.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Regressions & Progressions side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {exercise.regressions.length > 0 && (
          <Card className="border-t-4 border-t-green-400">
            <SectionTitle>Easier Variations ↓</SectionTitle>
            <div className="space-y-3">
              {exercise.regressions.map((r, i) => (
                <div key={r.id} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.name}</p>
                    <p className="text-sm text-gray-500">{r.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {exercise.progressions.length > 0 && (
          <Card className="border-t-4 border-t-amber-400">
            <SectionTitle>Harder Variations ↑</SectionTitle>
            <div className="space-y-3">
              {exercise.progressions.map((p, i) => (
                <div key={p.id} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Target Movements */}
      {exercise.movements.length > 0 && (
        <Card className="mb-6">
          <SectionTitle>Target Movements ({exercise.movements.length})</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {exercise.movements.map((em) => (
              <div key={em.id} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5">
                <EntityLink href={`/movements/${em.movement.slug}`} className="text-sm">
                  {em.movement.name}
                </EntityLink>
                <span className="text-xs text-gray-400 ml-1.5">
                  {em.movement.joint.name}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Functional Relevance */}
      {exercise.functionalTasks.length > 0 && (
        <Card className="mb-6">
          <SectionTitle>Why This Exercise Matters</SectionTitle>
          <p className="text-xs text-gray-500 mb-3">Everyday activities this exercise helps you do &mdash; <span className="font-medium text-indigo-700">essential</span> means it directly trains the capacity the task needs:</p>
          <div className="flex flex-wrap gap-2">
            {[...exercise.functionalTasks]
              .sort((a: any, b: any) => (a.relevance === "essential" ? -1 : 1) - (b.relevance === "essential" ? -1 : 1))
              .map((eft: any) => {
                const essential = eft.relevance === "essential";
                return (
                  <EntityLink
                    key={eft.id}
                    href={`/tasks/${eft.functionalTask.slug}`}
                    className={
                      essential
                        ? "rounded-md border border-indigo-300 bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-200 transition-colors"
                        : "rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                    }
                  >
                    {eft.functionalTask.name}
                    {essential && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-indigo-500">essential</span>}
                  </EntityLink>
                );
              })}
          </div>
        </Card>
      )}

      {/* Goals this exercise serves */}
      {(exercise as any).goals?.length > 0 && (
        <Card className="mb-6">
          <SectionTitle>Goals This Helps With</SectionTitle>
          <p className="text-xs text-gray-500 mb-3">Rehab, performance, prevention, and mobility goals this exercise supports &mdash; <span className="font-medium text-emerald-700">essential</span> means it&apos;s a cornerstone:</p>
          <div className="flex flex-wrap gap-2">
            {[...(exercise as any).goals]
              .sort((a: any, b: any) => (a.relevance === "essential" ? -1 : 1) - (b.relevance === "essential" ? -1 : 1))
              .map((eg: any) => {
                const essential = eg.relevance === "essential";
                const typeColor: Record<string, string> = {
                  rehab: "text-rose-600", performance: "text-amber-600", prevention: "text-sky-600", mobility: "text-teal-600",
                };
                return (
                  <EntityLink
                    key={eg.id}
                    href={`/goals/${eg.goal.slug}`}
                    title={eg.caution ? `Caution: ${eg.caution}` : undefined}
                    className={
                      essential
                        ? "rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                        : "rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                    }
                  >
                    {eg.goal.name}
                    <span className={`ml-1.5 text-[10px] uppercase tracking-wide ${typeColor[eg.goal.goalType] || "text-gray-400"}`}>{eg.goal.goalType}</span>
                    {eg.caution && <span className="ml-1 text-amber-500" aria-label="has caution">⚠</span>}
                  </EntityLink>
                );
              })}
          </div>
        </Card>
      )}

      {/* Evidence Notes */}
      {exercise.notes && (
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <SectionTitle>Research Notes</SectionTitle>
          <p className="text-sm text-amber-800 leading-relaxed">{exercise.notes}</p>
        </Card>
      )}

      {/* Sources */}
      {exercise.sources.length > 0 && (
        <Card>
          <SectionTitle>Evidence Sources ({exercise.sources.length})</SectionTitle>
          <ul className="space-y-2">
            {exercise.sources.map((s) => (
              <li key={s.id} className="flex items-start gap-2 text-sm">
                <span className="text-gray-400 mt-0.5">📄</span>
                <div>
                  <EntityLink href={`/sources/${s.source.slug}`}>{s.source.title}</EntityLink>
                  {s.source.authors && <span className="text-gray-400 text-xs ml-1">— {s.source.authors}</span>}
                  {s.notes && <p className="text-gray-500 text-xs mt-0.5">{s.notes}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
