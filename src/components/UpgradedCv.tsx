"use client";

import { useState } from "react";
import { Badge, Bullets, Button, GroupLabel, Meter, Spinner, scoreTone } from "./ui";
import { useLang } from "./lang";
import { cvFileName, upgradedCvToDocHtml } from "@/lib/cvExport";
import { hasPlaceholders, upgradedCvToText, type UpgradeResult } from "@/lib/schemas";

export function UpgradedCvTab({
  upgraded,
  previousScore,
  busy,
  note,
  onGenerate,
}: {
  upgraded: UpgradeResult | null;
  previousScore: number;
  busy: boolean;
  note: string | null;
  onGenerate: () => void;
}) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!upgraded) return;
    try {
      await navigator.clipboard.writeText(upgradedCvToText(upgraded.cv));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the text is on screen either way */
    }
  }

  function download() {
    if (!upgraded) return;
    const html = upgradedCvToDocHtml(upgraded.cv, {
      dir: t.dir,
      experienceTitle: t.upgradeExperience,
    });
    // The BOM keeps Word from guessing the encoding wrong on Hebrew.
    const blob = new Blob([`\ufeff${html}`], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = cvFileName(upgraded.cv, "doc");
    // Firefox only follows an anchor that is in the document, and revoking the
    // URL in the same tick can cancel the download before it starts.
    link.style.display = "none";
    document.body.append(link);
    link.click();
    setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 1000);
  }

  if (!upgraded) {
    return (
      <div className="max-w-lg">
        <p className="text-sm leading-relaxed text-ink-700">{t.upgradeIntro}</p>
        <Button onClick={onGenerate} disabled={busy} className="mt-4">
          {busy ? <Spinner /> : null}
          {busy ? t.upgrading : t.upgradeCta}
        </Button>
      </div>
    );
  }

  const cv = upgraded.cv;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={download}>{t.upgradeDownload}</Button>
        <Button variant="ghost" onClick={copy}>
          {copied ? t.upgradeCopied : t.upgradeCopy}
        </Button>
        <Button variant="ghost" onClick={onGenerate} disabled={busy}>
          {busy ? <Spinner /> : null}
          {t.upgradeAgain}
        </Button>
        <span className="flex min-w-40 flex-1 items-center gap-2">
          <Meter score={upgraded.score} />
          <Badge tone={scoreTone(upgraded.score)}>{t.upgradeScored(upgraded.score)}</Badge>
          <span className="tnum text-[11px] text-ink-500">{t.upgradeWas(previousScore)}</span>
        </span>
      </div>

      {note ? <p className="rounded-sm bg-sunk px-3 py-2 text-xs text-ink-700">{note}</p> : null}

      {hasPlaceholders(cv) ? (
        <p className="rounded-sm bg-warn-soft px-3 py-2 text-xs text-warn">{t.upgradePlaceholders}</p>
      ) : null}

      <article dir="auto" className="border-y border-line py-5">
        {cv.name ? (
          <h3 className="font-display text-2xl font-medium text-ink-900">{cv.name}</h3>
        ) : null}
        {cv.headline ? <p className="mt-0.5 text-sm text-ink-700">{cv.headline}</p> : null}
        {cv.contact ? <p className="mt-0.5 text-xs text-ink-500">{cv.contact}</p> : null}
        {cv.summary ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-900">{cv.summary}</p>
        ) : null}

        {cv.experience.length ? (
          <section className="mt-6">
            <h4 className="border-b border-line pb-1.5 text-xs font-semibold text-ink-500">
              {t.upgradeExperience}
            </h4>
            <div className="mt-3 space-y-4">
              {cv.experience.map((role, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-ink-900">{role.heading}</p>
                  {role.bullets.length ? (
                    <div className="mt-1.5">
                      <Bullets items={role.bullets} dot="bg-brand" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {cv.sections.map((section) => (
          <section key={section.title} className="mt-6">
            <h4 className="border-b border-line pb-1.5 text-xs font-semibold text-ink-500">
              {section.title}
            </h4>
            <ul className="mt-2.5 space-y-1 text-sm text-ink-900">
              {section.lines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </article>

      {cv.changes.length ? (
        <div>
          <GroupLabel>{t.upgradeChanges}</GroupLabel>
          <Bullets items={cv.changes} dot="bg-good" />
        </div>
      ) : null}
    </div>
  );
}
