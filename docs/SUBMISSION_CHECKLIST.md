# LEO Sentinel Submission Checklist

## Project and team

- [x] Add the final public GitHub repository URL to `README.md`.
- [x] List Shobhit Kapoor (`jawaharlaldoon-bit`) as the sole challenge entrant and current maintainer.
- [x] Complete the required IBM SkillsBuild activity for Shobhit Kapoor: **How IBM Bob and AI Tools Are Changing the Way Solutions Are Built** (2026-08-29). Evidence: [`05-skillsbuild-completed.png`](bob-evidence/05-skillsbuild-completed.png).
- [x] Complete `IBM_BOB_USAGE.md` with real prompts, commits, and screenshots.
- [x] Record Shobhit Kapoor's explicit contributions in the contribution record.

## Zero-cost deployment

- [x] Deploy publicly on Vercel Hobby after Hugging Face made new compute Spaces paid.
- [x] Keep the Docker image validated on port `7860` and deploy with `DEMO_MODE=true`.
- [x] Keep `WATSONX_API_KEY` and `WATSONX_PROJECT_ID` absent from Vercel because IBM Cloud activation requested a payment card; retain the verified cached/deterministic path.
- [x] Begin with `WATSONX_LIVE_ENABLED=false` and verify cache/fallback mode.
- [x] Do not activate Runtime Lite while the account requires payment-card verification; no paid IBM plan is needed for the submission.
- [x] Never select a paid plan, persistent paid storage, or upgraded hardware.
- [x] Open the public URL in a clean browser context and test Globe, Fleet, and APIs.

## Acceptance test

- [x] Space and Sky views load and remain interactive.
- [x] Fleet loads the cached Granite outlook without the Parquet dataset.
- [x] North Atlantic scenario shows a successful Goonhilly reroute.
- [x] Isolating Goonhilly produces a no-route critical result.
- [x] Mission brief cites only evidence IDs shown in the drawer.
- [x] `/api/health` reports fallback ready and exposes no secrets.
- [x] Tests, TypeScript, production build, and Docker build pass.

## Three-minute video

- **0:00–0:20** — Operators need fast, explainable answers during LEO outages.
- **0:20–0:40** — Show the retained Space/Sky/Fleet engine and LEO Sentinel layer.
- **0:40–1:25** — Run the North Atlantic outage; compare routes and evidence.
- **1:25–1:55** — Open Fleet; show five signals, 96 days, MAE/MAPE, and naïve baseline.
- **1:55–2:25** — Generate the grounded brief and expand its cited evidence.
- **2:25–2:45** — Show IBM Bob evidence, prompts, and validation commits.
- **2:45–3:00** — Close on resilience impact and the zero-cost architecture.

Keep the published video at or below three minutes and verify it is publicly viewable.

- [x] Final render is 2:28.63 (below the three-minute limit).
- [x] Publish the YouTube video as unlisted and verify the public link: https://youtu.be/GyvoJHHyz_g.

## Challenge publication

- [x] Complete every BeMyApp project section (100%).
- [x] Attach the public GitHub repository, live demo, and three-minute video.
- [x] Upload SkillsBuild completion evidence for the sole entrant.
- [x] Publish the August Space Exploration Challenge project page: https://aibuilderschallenge-bobhub.bemyapp.com/#/projects/6a94ce15a2c8f990e38623f6.
