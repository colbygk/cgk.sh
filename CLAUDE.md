# cgk.sh — working agreement

Personal Jekyll site (Journal theme). See `README.md` for running the dev
server in Docker, `_README.md` for the original theme docs.

## Engineering rubrics

These apply to every change in this repo and its sibling tools (e.g. the
horology catalog at `/Volumes/data02/personal/horology`).

- **TDD** — write the failing test first, make it pass, then refactor. A
  change without a test that would have caught its absence is not done.
  Liquid templates are verified by building the site and checking output.
- **DRY** — one source of truth per fact. Field lists, labels, colors and
  fonts are defined once (`_data/settings.yml`, a schema module) and
  derived everywhere else. Duplicate on purpose only when two things
  merely look alike but change for different reasons.
- **SOLID**
  - *Single responsibility* — a module does one job (render, store,
    project, publish), not several.
  - *Open/closed* — extend by adding (a new field in the schema, a new
    layout include), not by editing unrelated code.
  - *Liskov* — anything behind an interface (store, image processor,
    estimator) is swappable with a test double without surprises.
  - *Interface segregation* — pass collaborators the narrow thing they
    need, not the whole world.
  - *Dependency inversion* — core logic takes its I/O collaborators as
    arguments; wiring to real disks, binaries and APIs happens at the edge.
- **YAGNI** — build what is needed now. Leave a note, not an abstraction,
  for what might be needed later.
- **KISS** — prefer the platform (Node built-ins, Jekyll collections,
  plain HTML forms) over new dependencies.
- **Privacy by default** — this repo and `colbygk.github.io` are public.
  Anything personal (serial numbers, prices, contacts, private notes,
  photo EXIF/GPS) never lands here; tools publish an explicit whitelist.

## Site conventions

- Content types are Jekyll collections (`_posts`, `_projects`, `_watches`)
  with defaults wired in `_config.yml`.
- Styles: one partial per feature in `_sass/_includes/`, imported from
  `css/style.scss`; use the theme variables (`$text-dark-color`, `mq()`…)
  rather than literal values.
- `page.featured_image` drives the header background on every page.
- `_watches/` and `images/horology/` are **generated** by the horology
  tool's `publish` command — edit the catalog, not these files.
