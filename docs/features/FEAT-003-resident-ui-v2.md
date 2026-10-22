# FEAT-003: Resident screens in the v2 "tactile" design

Created: 2026-10-22T08:30:00+08:00
Updated: 2026-10-22T20:30:00+08:00
Revision: 1
Status: Approved
Len's chat instruction: On 2026-10-22 Len asked in chat to update the web app's UI and to "Implement: `Tabang Resident v2.dc.html`" from the Claude Design project, then said "continue where you left off" after authorizing design access.
Len's chat approval: Approved by Len in chat on 2026-10-22 at about 20:01 +08:00, after reviewing the implementation summary and commit `269de50`: "alright i approve you can push the branch, we'll work on the public and responder v2 screens next"
Architecture: [../product/ARCHITECTURE.md](../product/ARCHITECTURE.md) Revision 3, unchanged
Design source: Claude Design project `37ff3689-6501-4e24-8db2-b36dc0416ecb`, files `Tabang Resident v2.dc.html`, `TbHeader2.dc.html`, `TbNav2.dc.html`, `TbBadge2.dc.html`, and `tb-icons.js`

## Purpose and success

The resident screens (design screens 8 to 14) move to the v2 visual language: raised buttons, recessed fields, lit cards, icon navigation, and status badges with icons.
Behavior, data, and the API stay as FEAT-002 left them.
Success means the requirements below hold in the unit suite and in the screenshots recorded in `docs/evidence/FEAT-003.md`.

## Scope and non-goals

In scope:

- Shared chrome: the header with back button and menu, the icon bottom navigation, the offline banner, badges, buttons, fields, cards, and dialogs.
- Resident home, report a flood, ask for assistance, my reports, account, and the responder application, including their error, sending, failure, empty, and status states.

Non-goals:

- The design's "server waking up" panel, marked as a proposal in the design; it needs its own behavior spec.
- The design's "Report sent" confirmation screen; a sent report still opens My reports, as before.
- The public and responder screens beyond what the shared components change.
- A bundled webfont or new icon package; icons are inline SVG paths copied from `tb-icons.js`.

## Requirements

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| REQ-301 | Every resident screen keeps its fields, states, and data behavior. | Unit suite passes; test edits only follow renamed labels and the new confirmation step. |
| REQ-302 | Water depth and kind of help are radio rows, not dropdowns, and the number of people has − and + buttons. | Choosing "Knee deep" by its label submits `severity: knee`; stepper buttons are named "Fewer people" and "More people". |
| REQ-303 | A flood report asks where first; a help request asks what is needed first; the error summary lists problems in that order. | Error summary links point to the field ids in visual order. |
| REQ-304 | Status, verification, kind, and application badges carry an icon and a hidden prefix such as "Status: ". | Badges render the prefix in a visually hidden span. |
| REQ-305 | Discarding a report saved on the phone asks for confirmation, like cancelling a sent report. | "Keep report" leaves the entry queued; "Yes, discard report" removes it. |
| REQ-306 | The offline banner shows under the header on every resident screen. | The banner uses near-black on `#fac37b` and `role="status"`. |
| REQ-307 | All new colour pairs clear WCAG AA 4.5:1 at the lightest point of the shell. | `npm run check:contrast` passes with the v2 rows added. |
| REQ-308 | Route headings may differ from tab titles; the tab keeps the workspace name. | Router test checks each route's h1 and `document.title`. |

## Deliberate differences from the design

- Card highlights are 8% white at the top instead of 11%, because orange, blue, and pink text on 11% measured about 4.3:1.
- Red text uses `#ffbbbb`; the saturated `#ff6b6b` stays on borders and icons, because `#ff6b6b` text on a card measured 2.4:1.
- Existing privacy copy is kept where the design shortened it, such as who sees the contact number and location.
- "Municipality you cover" on the application stays a text field, because a provincial office covers more than one municipality.
- The header mark is cropped from the existing logo instead of shipping the design's separate `tabang-mark.png`.
