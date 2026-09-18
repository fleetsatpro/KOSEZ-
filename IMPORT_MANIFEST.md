# KOSEZ workspace import manifest

Source: `grok-workspace.zip`
Prepared: 2026-09-18

## Inventory

- Archive entries: 444
- Source-control files after generated/transient exclusions: 255
- Original payload represented by the clean archive: 24,549,492 bytes
- Clean archive SHA-256: `6fbafa0bfa862fe6ebf74dc66523a412e6fb1f3c81fa61d9b8f6b5b8b9c96674`

## Exclusions

Generated or transient output is deliberately excluded:

- `.vercel/output/`
- `.tanstack/tmp/`
- `.grok/preview.log`
- `.grok/status`
- `node_modules/`
- `.env` / `.env.*`

The project source, migrations, skills, screenshots, images, fonts, configuration, tests, scripts, and other non-generated workspace content are retained.

## Transfer state

The GitHub-connected environment cannot directly stream a local binary archive into GitHub. The exact clean archive is therefore available as a verified transfer artifact, while `grok-workspace-import` contains the guarded importer needed to place its contents into the repository without changing the root layout.

The importer verifies the SHA-256 digest before touching the checkout and performs a credential-pattern scan before committing.
