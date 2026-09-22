# cgk.sh

Personal Jekyll site (Journal theme), served via Docker.

## Working end to end

### The three repos

| Repo | Path | What it is |
|---|---|---|
| **cgk.sh** (this one) | `~/s/personal/cgk.sh` | Site source: posts, layouts, styles, tests. Public. |
| **colbygk.github.io** | `~/s/personal/colbygk.github.io` | The *built* site. GitHub Pages serves it at cgk.sh. Public. Never edit by hand. |
| **horology** | `~/p2/horology` | Private watch catalog and admin UI; publishes a public view into cgk.sh. Private. |

`~/s` is `/Volumes/data01/scratch` and `~/p2` is `/Volumes/data02/personal`,
so the same checkouts also appear under those paths. `bit` and `pit` find
the Pages repo as `../colbygk.github.io`, so keep the two side by side.

```
 blog post ─────────────► cgk.sh/_posts/ ─┐
                                          ├─► preview (localhost:8086) ─► commit + push cgk.sh
 horology admin ─ publish ► _watches/ ────┘                                      │
                            images/horology/                                     ▼
                                                    ./bit  (build into ../colbygk.github.io)
                                                    ./pit  (commit "publish" + push)
                                                                                 ▼
                                                               GitHub Pages ─► https://cgk.sh
```

Nothing is live until `pit` pushes the Pages repo. Pushing cgk.sh alone
changes nothing on the site; it keeps the source in step with what's live.

### 1. Start the dev server

Docker Desktop must be running. The container `cgkyll-dev` serves the
working tree at <http://localhost:8086> and rebuilds on every save (see
[Running the dev server](#running-the-dev-server) to create it the first
time):

```sh
docker start cgkyll-dev      # if it isn't already running
docker logs -f cgkyll-dev    # watch rebuilds; errors show up here
```

(`./sit` is an older one-off alternative: `jekyll serve` on port 4000.)

### 2a. Write or edit a blog post

Posts live in `_posts/YYYY-MM-DD-slug.md` and are served at
`/blog/<slug>`. Front matter:

```yaml
---
title: 'Post title'                  # required; must be unique (the build fails on duplicates)
date: 2026-09-22 10:00:00
thumb: '/images/<topic>/name-thumb.jpg'   # optional: strip shown in the post list
excerpt: one line for the post list  # optional: otherwise the first paragraph
tags: ['astronomy', 'hcro']          # optional: shown as pills, searchable in the filter
---
```

Put images under `images/<topic>/`. Strip GPS/camera metadata before
committing photos. A photo grid is `<div class="gallery" data-columns="2">`
with `<img>`s inside; `data-columns="1"` makes a carousel. Any gallery
photo, and any content image at least 480px, opens in the image viewer.
Code goes in `{% highlight ruby %} … {% endhighlight %}`, using `text`
for logs and `console` for commands with a `$`/`#` prompt.

### 2b. Update the watch collection (horology)

Everything about a watch is edited in the horology admin, never in
cgk.sh. `_watches/` and `images/horology/` are overwritten on every
publish.

```sh
cd ~/p2/horology
npm start                            # admin UI at http://localhost:4321
node bin/horology.js serve --lan     # same, reachable from your phone (prints a token link)
```

1. Add or edit the watch, its photos, captions and service history.
   The **Story** is published; **Private notes**, photos marked private,
   the serial, owner, provenance, prices and valuations never leave the
   catalog (`src/domain/schema.js` decides, field by field).
2. Tick **Show on cgk.sh/horology**, then **Publish to cgk.sh** in the admin
   (or `node bin/horology.js publish`). This rewrites `_watches/*.md` and
   `images/horology/<watch>/` in this repo, including removing watches
   and photos that are no longer published.
3. Check it on the dev server: **View on site** opens
   `http://localhost:8086/horology/<watch-id>/`.
4. Back in horology: `npm test`, then commit the catalog change there.

### 3. Check

```sh
git status            # expect only the files you meant to change
docker exec cgkyll-dev sh -c 'jekyll build -d /tmp/verify &&
  for t in test/*_test.rb; do SITE=/tmp/verify ruby $t; done'
node --test 'test/browser/*.test.mjs'   # image viewer; needs the dev server
```

See [Tests](#tests) for what they cover.

### 4. Commit and push cgk.sh

Work on a branch, then fast-forward `master`:

```sh
git switch -c my-change
git add <files> && git commit
git switch master && git merge --ff-only my-change && git push
```

Horology publishes show up here as changes under `_watches/` and
`images/horology/`; commit them like any other change.

### 5. Publish: `bit` then `pit`

Run both from this repo's root, with `master` pushed and a clean tree
(`bit` builds whatever is in the working tree, committed or not):

```sh
./bit      # docker: jekyll build -d ../colbygk.github.io
```

`bit` rebuilds the whole site into the Pages repo, deleting pages that no
longer exist (it keeps that repo's `.git`). **Review before pushing**:

```sh
git -C ../colbygk.github.io status --short -uall
```

Expect the pages you changed, plus every page when a layout, stylesheet
or script changed. Anything you didn't mean to publish (a `test/`
folder, a draft, a private file) means it's missing from `exclude:` in
`_config.yml`; fix that and run `./bit` again. To start over, run
`git -C ../colbygk.github.io checkout . && git -C ../colbygk.github.io clean -fd`.

```sh
./pit      # in ../colbygk.github.io: git add . && git commit -m publish && git push
```

### 6. Confirm it's live

GitHub Pages takes a minute or two:

```sh
gh api repos/colbygk/colbygk.github.io/pages/builds/latest --jq '.status + " " + .commit[0:7]'
git -C ../colbygk.github.io rev-parse --short=7 HEAD    # should match once "built"
SITE_URL=https://cgk.sh node --test 'test/browser/*.test.mjs'
```

If a change doesn't show in your browser, hard-refresh (Cmd+Shift+R);
stylesheets and scripts are cached.

### Troubleshooting

- **Dev server shows an old page:** `docker logs cgkyll-dev` for build
  errors; `docker restart cgkyll-dev` if it stopped noticing changes.
- **`Duplicate posts:` build error:** two posts share a title; rename or
  remove one.
- **`bit` fails with "Unable to find image":** build it once:
  `docker build -t cgkyll:latest .` (also after any `Gemfile` change).
- **Pages build `errored`:** check the repo's Actions/Pages settings on
  GitHub; the site keeps serving the previous build meanwhile.

## Running the dev server

The dev server runs Jekyll in `serve` mode with auto-regeneration. Source is bind-mounted, so edits on the host trigger rebuilds inside the container.

### One-time: build the image

```sh
docker build -t cgkyll:latest .
```

The image is based on `jekyll/builder:3.8.5` (amd64; runs under emulation on Apple Silicon — first build is slow, ~3–4 minutes).

### Start the dev server

```sh
docker run -d --name cgkyll-dev \
  -p 8086:8086 \
  -v "$PWD:/srv/jekyll" \
  cgkyll:latest
```

Open <http://localhost:8086>.

The container's default `CMD` is `jekyll serve --host 0.0.0.0 --port 8086 --force_polling`. `--force_polling` is required for file-watching to work across the macOS → Linux bind mount.

### Tail logs / stop / restart

```sh
docker logs -f cgkyll-dev      # follow build + request logs
docker stop cgkyll-dev         # stop
docker start cgkyll-dev        # restart (keeps the container)
docker rm -f cgkyll-dev        # remove
```

### One-off build (no server)

```sh
docker run --rm -v "$PWD:/srv/jekyll" cgkyll:latest jekyll build
```

Output goes to `_site/`.

## Notes

- The host volume mount overlays the files baked into the image, so the `bundle install` from the build is what supplies the gems — host doesn't need Ruby/Jekyll installed.
- If `Gemfile` changes, rebuild the image.
- See `_README.md` for the original Journal theme documentation.

## Legacy `/webfm_send/<fid>` references

Posts migrated from the old Drupal site contain `<img>`, `<video>`, and
`<a>` tags pointing at `/webfm_send/<numeric-fid>`. At build time,
`_plugins/webfm.rb` rewrites every such reference to a path of the form
`/files/<original-relative-path>`, using the fid → path mapping in
`_data/webfm.yml` (regenerated from `old-shrewdraven/webfm_files.ndjson`).

To make a referenced asset actually resolve, drop the binary into the
repo at the path Jekyll will serve it from. For example, fid `32` maps
to `sites/default/files/webfm/users/colby/blog/chromoscope.png`, which
becomes `/files/webfm/users/colby/blog/chromoscope.png` — so the binary
goes at `files/webfm/users/colby/blog/chromoscope.png` in the repo.

The mapping covers images, audio, and video (anything Drupal's webfm
module served). Look up the target path for any fid with:

```sh
grep -A1 "^  <fid>:" _data/webfm.yml
```

## Horology (`/horology/`)

`_watches/` and `images/horology/` are generated by the private catalog
tool in `/Volumes/data02/personal/horology` (`node bin/horology.js
publish`). Don't hand-edit them; the layout is `_layouts/watch.html`, the
index is `horology/index.html`, styles are `_sass/_includes/_horology.scss`.

## Post list (`/` and `/blog/`)

Every post is listed on one page, grouped by year, via
`_includes/posts.html`. The same markup has several layouts, each a
stylesheet in `_sass/_includes/_posts-<id>.scss` keyed on
`.posts[data-post-layout="<id>"]`. The layouts are listed in
`_data/settings.yml` under `post_list.layouts`; the first is the default.
Visitors switch layouts on the home page and `js/blog.js` remembers their
choice. `/blog/` pins the index layout with `{% include posts.html
layout="index" %}`.

To add a layout: add it to `post_list.layouts`, write its
`_posts-<id>.scss` wrapped in `@include post-layout(<id>) { … }`, and
import it from `css/style.scss`.

`_plugins/duplicate_posts.rb` fails the build if two posts share a title.

## Tests

Build checks run in the container, one file per area (`test/*_test.rb`):

```sh
docker exec cgkyll-dev sh -c 'jekyll build -d /tmp/verify &&
  for t in test/*_test.rb; do SITE=/tmp/verify ruby $t; done'
```

Browser checks (the image viewer, `js/lightbox.js`) drive headless
Chromium against the running dev server using only Node built-ins:

```sh
node --test 'test/browser/*.test.mjs'   # SITE_URL, CHROME to override
```
