---
title: Blog Archive
permalink: /blog/
---

<section class="blog archive">
  <div class="wrap">
    {% assign posts_by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
    {% for year in posts_by_year %}
      <h2 id="{{ year.name }}">{{ year.name }}</h2>
      <ul class="archive-list">
      {% for post in year.items %}
        <li>
          <span class="archive-date">{{ post.date | date: "%b %-d" }}</span>
          <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        </li>
      {% endfor %}
      </ul>
    {% endfor %}
  </div>
</section>
