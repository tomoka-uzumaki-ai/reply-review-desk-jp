# Publication Batch Desk — free prototype 0.1.0

Prepare your owned illustrations or other works for single purchases, monthly bundles and several destinations. Keep work assignments, product titles, prices and delivery filenames together, and notice reused work before offering it twice.

## Start

Use the web preview supplied with this release when available. This download contains `index.html`, `core.js` and `app.js`; keep them together. The application has no server-side processing or account connection. Direct local-file launch (`file://`) has not been verified in this release. A static web server is an alternative way to open the folder; this README does not claim that a direct double-click route was tested.

The interface is in English. The layout adapts to smaller windows, but browser and device compatibility must be checked in your environment. Save a JSON backup before closing or reloading the page.

## One complete example

1. The fictional catalog contains three garden illustration records. The image files themselves are not included.
2. `WORK-001` is in both a previously released single item and an October bundle. Review the content overlap and explain any reuse to your customers.
3. `WORK-003` has unknown AI provenance and no filenames. Record the actual workflow and files, or remove an unused record.
4. Assign your own work IDs to an offer. Choose single purchase or monthly bundle, then add destination variants with product title, price, currency and delivery filenames. “Fill from assigned works” copies names only.
5. Review missing data, save JSON, export CSV and download the TXT handoff. Locate and inspect the actual artwork files, then enter product information manually at your chosen destination.

You can restore JSON or import CSV to replace the current batch after confirmation. Both formatted JSON and CSV must fit within **2,000,000 UTF-8 bytes**. Oversized imports or edits preserve the prior batch. Multibyte text, CSV quoting, BOM and the JSON final newline count toward the limit. Formula-like cells are escaped for spreadsheet export and restored by this app.

## What the checks mean

- Overlap compares **recorded work IDs**. It does not compare image meaning, pixels or filenames to identify the same artwork under different IDs.
- Filename manifests are lists to inspect. They do not upload, include or verify real file bytes. A reused filename is a possible collision, not proof of matching content.
- AI provenance and ownership notes are your records. The desk does not establish legal rights or platform eligibility.
- Destination names are free-form labels. The sample stores are fictional. No AI-permission, content policy or platform approval is built into the desk; verify current rules at your actual destination.
- Different currencies are kept separate. No exchange rate, combined sales total, fee or profit is calculated.
- The TXT is a manual handoff. It does not publish, schedule, sell, send messages, accept payments or verify customer delivery.

## Included files

`index.html`, `core.js`, `app.js`, this README, `synthetic-example.json`, `synthetic-example.csv`, and `synthetic-handoff.txt`. All examples are synthetic; no images, credentials, customer records or paid-product code are included.

Data stays in page memory until you download it. There is no analytics, network request, browser storage or asset fetching. Check that downloaded files were saved successfully and keep backups in a location you trust.

A spreadsheet, Notion or your destination's native tools may be enough for a simple catalog. This prototype focuses on assignments, destination variants, overlapping work and delivery manifests. It is free to try; no purchase, market validation or profit is represented by the example.
