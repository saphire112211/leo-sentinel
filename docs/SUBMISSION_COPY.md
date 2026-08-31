# LEO Sentinel — BeMyApp Submission Copy

## Project title

LEO Sentinel

## One-line pitch

An evidence-grounded mission-resilience copilot that simulates LEO network outages, verifies reroutes, forecasts fleet health, and produces actionable operator briefs.

## Challenge theme

Advance Space Exploration with AI

## Problem

LEO operators can see enormous volumes of orbital and network telemetry, but an outage still forces them to answer urgent operational questions across disconnected tools: what failed, whether a viable route remains, what tradeoff the reroute introduces, and what action is supported by the evidence. Generic chat interfaces are not safe for this workflow because they can detach recommendations from the underlying mission state.

## Solution

LEO Sentinel adds a mission-intelligence layer to an existing real-time Starlink visualization. An operator can select a predefined resilience scenario or disable specific gateways and satellites, calculate a baseline and degraded route on the same globe, quantify latency and hop deltas, inspect every evidence item, view a 96-day fleet outlook, and generate a structured mission brief whose claims must cite valid evidence IDs.

The public demo remains useful when IBM live inference is unavailable: cached forecasts and a clearly labeled deterministic brief preserve the workflow without claiming that a live model ran.

## How it works

1. Existing SGP4 propagation and current TLE data provide satellite positions.
2. The existing inter-satellite-link graph and operational ground-station data calculate the baseline route.
3. A deterministic scenario layer removes selected assets and recalculates the degraded route.
4. LEO Sentinel derives route deltas, affected assets, risk score, and typed evidence.
5. The Fleet view presents a 96-day, five-signal Granite Time Series outlook with backtesting.
6. The mission-brief pipeline sends only calculated evidence to the configured Granite language model, validates every cited evidence ID, and falls back honestly if live Runtime Lite access is unavailable.

## Judge demo

- Open Mission Ops on the public globe.
- Run **North Atlantic gateway outage**.
- Compare the baseline route to Ballinspittle with the degraded reroute to Goonhilly.
- Verify the displayed tradeoff: **+4.5 ms**, **+1 hop**, and **risk 50/100**.
- Open Fleet and inspect the **96-day** outlook built from **640 daily observations**.
- Review backtesting: **MAE 12.51**, **MAPE 0.13%**, and **94.76% improvement over the naïve baseline**.
- Generate the mission brief and expand the evidence drawer to verify its cited evidence IDs and fallback/model label.

## IBM technology

### IBM Bob

IBM Bob was the primary development tool for the challenge-specific work. It was used to initialize repository context, plan the in-place routing/scenario changes, audit implementation gaps, guide IBM integration work, and validate the result. The public repository contains `IBM_BOB_USAGE.md` plus timestamped screenshots documenting prompts, results, and related commits.

### IBM Granite Time Series

The Fleet experience is designed for `ibm/granite-ttm-512-96-r2`: at least 512 historical daily observations in, 96 forecast days out. Five operational fleet signals are supported. The demo includes a versioned cached result and reports MAE, MAPE, and a naïve-baseline comparison so forecast quality is measurable.

### IBM Granite mission briefs

The server-side watsonx integration is configured for `ibm/granite-4-h-small`. The model receives structured evidence rather than raw open-ended chat, and output must match a typed schema. Invalid evidence references are rejected, malformed output is retried once, and cached or deterministic output is visibly labeled when live Runtime Lite access is unavailable.

## Innovation

LEO Sentinel does not ask a model to invent orbital facts. It separates the workflow into measured, calculated, simulated, and AI-derived layers. Classical orbital propagation and pathfinding establish the mission state; deterministic scenarios establish the counterfactual; IBM AI forecasts future fleet conditions and explains only the supplied evidence. This makes the operator recommendation inspectable and failure-safe.

## Technical execution

- Next.js 16, React 19, TypeScript, React Three Fiber, and Three.js
- SGP4 propagation with live/cached TLE sources
- Existing WebSocket telemetry, handoffs, Space, Sky, and Fleet views preserved
- Typed scenario, forecast, brief, and health APIs
- Server-only IBM credentials, IAM token cache, timeouts, retry, validation, rate limiting, and typed errors
- Versioned cached AI outputs and deterministic fallbacks
- Vitest regression and failure-path coverage
- Docker image validated on port 7860
- Free public Vercel Hobby deployment with demo mode enabled

## Real-world impact

The workflow helps an operator move from detection to a defensible response in one interface. It makes the cost of a reroute explicit, exposes the evidence behind an AI-generated brief, and continues operating when an upstream AI allowance is unavailable. The same pattern can extend to other LEO constellations, gateway networks, disaster-response connectivity, and network-operations training.

## Feasibility and zero-cost design

The public submission does not require a physical Starlink dish, paid database, paid compute, paid model plan, or dedicated operations infrastructure. Demo telemetry, cached model outputs, bounded public calls, and deterministic fallbacks keep the experience available within free allowances. No interaction in the public app can upgrade or create a paid service.

## Existing work and challenge work

The submission transparently builds on an MIT-licensed Starlink visualization. The existing Next.js/Three.js visualization, propagation, routing, telemetry, data, and Fleet foundations are preserved. Shobhit Kapoor's challenge work is the LEO Sentinel Mission Ops workflow, reusable scenario calculations, predefined outages, disabled-asset simulation, route comparison and risk evidence, Granite forecast integration and evaluation, grounded mission-brief pipeline, API hardening, zero-cost fallbacks, testing, deployment, and submission materials. Original copyright notices, license text, attribution, and Git history remain intact.

## Team

Shobhit Kapoor (`jawaharlaldoon-bit`) — sole challenge entrant and current maintainer.

## Links

- Public demo: https://leo-sentinel.vercel.app
- Source: https://github.com/jawaharlaldoon-bit/leo-sentinel
- Video: https://youtu.be/GyvoJHHyz_g

## Limitations

- The public deployment defaults to cached/deterministic AI output unless a verified free watsonx Runtime Lite allowance and server-side credentials are enabled.
- Scenarios are decision-support simulations, not commands to a production constellation.
- Forecast quality depends on the historical dataset and is reported through backtesting rather than guaranteed future accuracy.
- Gateway and TLE freshness depend on their upstream public sources and caches.

## Organizer eligibility confirmation request

Subject: Eligibility confirmation — LEO Sentinel substantial MIT-licensed base

Hello AI Builders Challenge team,

I am preparing LEO Sentinel for the August challenge under “Advance Space Exploration with AI.” The submission transparently builds on a substantial MIT-licensed visualization and preserves its license, copyright notices, attribution, and Git history. My challenge contribution is the new in-place Mission Ops scenario workflow, outage simulation and route evidence, Granite Time Series forecast and evaluation, grounded Granite mission briefs, API safeguards, testing, deployment, and submission materials. IBM Bob is documented as the primary development tool for this challenge work.

Could you please confirm in writing that this transparent reuse and substantial new challenge contribution are eligible under the rules? Repository: https://github.com/jawaharlaldoon-bit/leo-sentinel

Thank you,
Shobhit Kapoor
