# FEAT-004: Public and responder screens in the v2 "tactile" design

Created: 2026-10-22T20:30:00+08:00
Updated: 2026-10-22T20:35:48+08:00
Revision: 1
Status: Approved
Len's chat instruction: On 2026-10-22 at about 20:01 +08:00, approving FEAT-003, Len said in chat: "we'll work on the public and responder v2 screens next".
Len's chat approval: Approved by Len in chat on 2026-10-22 at about 20:35 +08:00, after reviewing the implementation summary, commits `26ba40d` and `da262b3`: "alright push"
Architecture: [../product/ARCHITECTURE.md](../product/ARCHITECTURE.md) Revision 3, unchanged
Builds on: [FEAT-003-resident-ui-v2.md](FEAT-003-resident-ui-v2.md), approved
Design source: Claude Design project `37ff3689-6501-4e24-8db2-b36dc0416ecb`, files `Tabang Public v2.dc.html` (screens 1 to 7) and `Tabang Responder v2.dc.html` (screens 15 to 19)

## Purpose and success

The public screens and the responder and reviewer workspace move to the v2 visual language FEAT-003 introduced.
Behavior, data, and the API stay as they are, apart from the confirmations and the sign-in fix listed below.
Success means the requirements below hold in the unit suite and in the screenshots recorded in `docs/evidence/FEAT-004.md`.

## Scope and non-goals

In scope:

- Public: landing, hotline directory, sign in, create an account, reset password, choose a new password, privacy policy, page not found.
- Responder and reviewer: dashboard, incident queue, incident detail, advisories, review applications, and the desktop sidebar.

Non-goals, each needing new data or behavior and its own spec:

- Advisory kind and expiry fields, and a municipality filter on the queue.
- Dashboard counts per status; the dashboard keeps the five counts the server provides.
- The desktop queue table and the reviewer's list-and-detail layout; wide screens get two-column cards instead.
- "Claimed by" names, a pinned action bar, outcome toasts, the expired reset link screen, and a single password field without confirmation.
- Distinct "too many attempts" and "server unreachable" sign-in boxes; the existing messages show in the new error box.

## Requirements

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| REQ-401 | Every public and responder screen keeps its fields, states, and data behavior. | Unit suite passes; test edits only follow renamed labels, headings, and the new confirmations. |
| REQ-402 | 911 is never more than one tap away on public screens: the landing's call button, a pinned 911 row above a loaded hotline list, and the 911 card on an empty or failed list and on page not found. | Hotline and router tests find the 911 links in each state. |
| REQ-403 | Verifying or rejecting an incident, and unpublishing an advisory, ask for confirmation; the safe button takes the focus. | Tests show the repository is not called until "Yes, reject" or "Yes, unpublish". |
| REQ-404 | The dashboard's Unclaimed row opens the queue filtered to Unclaimed. | The queue reads `?status=new` as its first filter. |
| REQ-405 | Review buttons name the applicant for screen readers, and "evidence deletion pending" reads as in progress, not failed. | Buttons are named "Approve Maria Santos"; the message uses the warning tone. |
| REQ-406 | All new colour pairs clear 4.5:1, including on the lighter responder shell. | `npm run check:contrast` passes with the responder rows added. |
| REQ-407 | A refused sign-in or sign-up keeps the form and shows the error. | `authGateway.test.js` and the sign-in screenshot. |

## Deliberate differences from the design

- The responder workspace uses 92% white for secondary text and white for call rows, because 82% white and orange measured 4.05:1 and 2.96:1 on its lighter shell.
- Hotline number links keep the number as their name, with "Tap to call" hidden from screen readers.
- Sign-up and the new password page keep the confirmation field, because removing it changes validation.
- The reset confirmation shows the existing wording plus the address it was sent to, so it reads the same whether or not the account exists.
- The incident page keeps "Incident details" as its main heading and shows the need and place as the next heading, because one main heading per page is a tested rule.
