# FEAT-004 evidence

Created: 2026-10-22T20:30:00+08:00
Spec: [../features/FEAT-004-public-responder-ui-v2.md](../features/FEAT-004-public-responder-ui-v2.md) Revision 1

| Requirement | Check | Conditions | Result | Time | Notes |
| --- | --- | --- | --- | --- | --- |
| REQ-401 to REQ-405, REQ-407 | `npm run test:unit` | Local, Node v24.14.0, jsdom | Passed under stated conditions: 24 files, 241 of 241 tests. | 2026-10-22T20:20+08:00 | Test edits follow renamed headings ("Call for help", "Hotlines", "Sign in", "Dashboard", "Incidents", "Page not found"), labels ("Email", "Phone number", "Open in Google Maps"), applicant-named review buttons, and the new confirmations; the reject and unpublish tests now also prove nothing is sent before confirming. |
| REQ-406 | `npm run check:contrast` | Pairs at the lightest point of each shell | Passed under stated conditions: all pairs clear 4.5:1, with 7 responder-shell rows added. | 2026-10-22T20:20+08:00 | - |
| All | `npm run check` | Lint, secret scan, contrast, unit, server tests, build | Passed under stated conditions: exit 0; 43 of 43 server tests. | 2026-10-22T20:20+08:00 | - |
| All | `npm run test:integration` | Local Postgres 17 in Docker | Passed under stated conditions: 46 of 46 tests. | 2026-10-22T20:21+08:00 | Covers the changed sign-in gateway against the real server. |
| REQ-407 | Sign in with a wrong password in headless Microsoft Edge | Built app on 127.0.0.1:18200, local Postgres | Failed first, then passed: before the fix the form was replaced by "Checking your session" and stayed there; after `26ba40d` the error box shows and the form keeps the email. | 2026-10-22T20:15+08:00 | Found while capturing the sign-in screenshot; the bug came from FEAT-002, not this restyle. Attempt 1 settled the session after a refusal but the remounted form lost its error; attempt 2 announces the pending session only after the server accepts. |
| REQ-401 to REQ-406 | Screenshots, headless Microsoft Edge through the DevTools protocol | Throwaway resident, admin, and applicant accounts; sample hotlines, reports, and one advisory; 390px wide unless named | Captured and reviewed by eye against the design: [landing](FEAT-004/01-landing.png), [hotlines](FEAT-004/02-hotlines.png), [sign-in error](FEAT-004/03-sign-in-error.png), [sign-up errors](FEAT-004/04-sign-up-errors.png), [reset sent](FEAT-004/05-reset-sent.png), [privacy](FEAT-004/07-privacy.png), [not found](FEAT-004/07b-not-found.png), [dashboard](FEAT-004/15-dashboard.png), [queue](FEAT-004/16-queue.png), [queue at 1280px](FEAT-004/16d-queue-desktop.png), [detail unclaimed](FEAT-004/17-detail-unclaimed.png), [detail claimed](FEAT-004/17b-detail-claimed.png), [reject dialog](FEAT-004/17c-reject-dialog.png), [detail at 1280px](FEAT-004/17d-detail-desktop.png), [advisories](FEAT-004/18-advisories.png), [applications](FEAT-004/19-applications.png), [review dialog](FEAT-004/19b-reject-dialog.png) | 2026-10-22T20:25+08:00 | The queue screenshots include reports left from earlier capture runs. Physical phones, screen readers, and the hosted Render site are not checked. |

## Found and fixed while checking

- The reviewer's six bottom tabs broke words mid-label at 390px; the labels now shrink to fit whole.
- Two-part link names ran together ("Emergency911"); a space now separates them for screen readers.
