# FEAT-003 evidence

Created: 2026-10-22T08:45:00+08:00
Spec: [../features/FEAT-003-resident-ui-v2.md](../features/FEAT-003-resident-ui-v2.md) Revision 1

| Requirement | Check | Conditions | Result | Time | Notes |
| --- | --- | --- | --- | --- | --- |
| REQ-301 to REQ-305, REQ-308 | `npm run test:unit` | Local, Node v24.14.0, jsdom | Passed under stated conditions: 23 files, 238 of 238 tests. | 2026-10-22T08:40+08:00 | Test edits follow renamed labels ("Report a flood", "Phone number", "Save changes", "Send application", "Cancel report", "Call 911"), radio rows instead of a depth dropdown, and the new discard confirmation; the discard test now also proves "Keep report" leaves the entry queued, and the route test now also checks every tab title. |
| REQ-307 | `npm run check:contrast` | Pairs measured against the lightest point of the shell | Passed under stated conditions: all pairs clear 4.5:1, including 11 new v2 rows. | 2026-10-22T08:40+08:00 | Card highlight held to 8% and red text kept at `#ffbbbb`; see the spec's deliberate differences. |
| All | `npm run check` | Lint, secret scan, contrast, unit, server tests, build | Passed under stated conditions: exit 0; 43 of 43 server tests. | 2026-10-22T08:40+08:00 | - |
| All | `npm run test:integration` | Local Postgres 17 in Docker | Passed under stated conditions: 46 of 46 tests. | 2026-10-22T08:41+08:00 | Real client repositories against the real server. |
| REQ-301 to REQ-306 | Screenshots of the built app, headless Microsoft Edge through the DevTools protocol | `npm start` on 127.0.0.1:18200 with local Postgres, a throwaway resident account, two sample reports and two sample advisories; 390px wide unless named | Captured; reviewed by eye against the design: [home](FEAT-003/08-home.png), [home with a saved report](FEAT-003/08-home-pending.png), [home at 1280px](FEAT-003/08-home-desktop.png), [flood report](FEAT-003/09-report-flood.png), [errors](FEAT-003/09b-report-errors.png), [help request](FEAT-003/10-request-help.png), [send failed](FEAT-003/11d-send-failed.png), [offline](FEAT-003/11e-offline.png), [my reports](FEAT-003/12-my-reports-pending.png), [cancel dialog](FEAT-003/12b-cancel-dialog.png), [account](FEAT-003/13-account.png), [application](FEAT-003/14-application.png), [responder dashboard](FEAT-003/r-dashboard.png) | 2026-10-22T08:35+08:00 | The send failure was forced by failing the report request in the browser. Emulator-style capture only; physical phones, screen readers, and the hosted Render site are not checked. |

## Found and fixed while checking

- A narrow-screen rule reset the content padding to zero and hid the last button behind the bottom navigation; the rule was removed.
- Empty status regions still took a flex gap; they now stay mounted for screen readers but out of the layout.
- The reviewer's six bottom tabs overflowed at 390px; their labels shrink on phones.
