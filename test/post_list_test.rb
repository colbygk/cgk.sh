# Checks the built home page's post list. Run against a fresh build:
#
#   docker exec cgkyll-dev sh -c \
#     'jekyll build -d /tmp/verify && SITE=/tmp/verify ruby test/post_list_test.rb'
require 'minitest/autorun'
require 'yaml'
require 'date'

SITE = ENV.fetch('SITE', '_site')

class PostListTest < Minitest::Test
  def setup
    @html = File.read(File.join(SITE, 'index.html'))
    @posts = Dir['_posts/*.md'].map do |f|
      fm = YAML.safe_load(File.read(f).split(/^---\s*$/)[1], permitted_classes: [Date, Time])
      { slug: File.basename(f, '.md').sub(/^\d{4}-\d\d-\d\d-/, ''), year: File.basename(f)[0, 4], thumb: fm['thumb'] }
    end
    @settings = YAML.safe_load(File.read('_data/settings.yml'))['post_list']
  end

  def items
    @html.scan(%r{<li class="post[ "].*?</li>}m)
  end

  def test_every_post_is_listed_once
    assert_equal @posts.size, items.size
    @posts.each { |p| assert_equal 1, @html.scan(%r{href="/blog/#{Regexp.escape(p[:slug])}"}).size, p[:slug] }
  end

  def test_years_are_grouped_newest_first
    years = @html.scan(/<section class="post-year" id="y-(\d{4})"/).flatten
    assert_equal @posts.map { |p| p[:year] }.uniq.sort.reverse, years
  end

  def test_photo_posts_carry_their_image
    @posts.select { |p| p[:thumb] }.each do |p|
      item = items.find { |i| i.include?("/blog/#{p[:slug]}\"") }
      assert_includes item, "background-image: url(#{p[:thumb]})", p[:slug]
    end
  end

  def test_layout_buttons_come_from_settings
    ids = @html.scan(/data-layout="([a-z]+)"/).flatten
    assert_equal @settings['layouts'].map { |l| l['id'] }, ids
  end

  def test_histogram_covers_every_year_including_gaps
    years = @html.scan(/class="post-hist__bar[^"]*"[^>]*data-year="(\d{4})"/).flatten.map(&:to_i)
    lo, hi = @posts.map { |p| p[:year].to_i }.minmax
    assert_equal hi.downto(lo).to_a, years
    assert_match(/data-year="2015"[^>]*style="--n: 0"/, @html)
  end

  def test_no_pagination
    refute_match(/pagination/, @html)
    refute File.exist?(File.join(SITE, 'blog/page2/index.html')), 'paginated pages still generated'
  end

  def css
    @css ||= File.read(File.join(SITE, 'css/style.css'))
  end

  # The selected layout reads in the site's link blue, not the pale accent.
  def test_selected_layout_uses_link_color
    blue = YAML.safe_load(File.read('_data/settings.yml'))['color_settings']['text_dark_color']
    assert_match(/\.post-nav__layout\[aria-pressed="?true"?\]\{[^}]*background:#{Regexp.escape(blue)}/i, css)
  end

  # Baloo's glyphs sit high in their line box, so pills pad more on top
  # than on the bottom to centre the text optically.
  def test_pills_pad_more_on_top
    %w[post-nav__layout post-nav__year post__tag].each do |cls|
      rule = css[/\.#{cls}\{[^}]*\}/].to_s
      top = rule[/padding-top:calc\(([\d.]+)em/, 1].to_f
      bottom = rule[/padding-bottom:calc\(([\d.]+)em/, 1].to_f
      assert_operator top, :>, 0, "#{cls} has no optical padding: #{rule}"
      assert_match(/padding-top:calc\([\d.]+em \+ [\d.]+em\)/, rule, cls)
      assert_match(/padding-bottom:calc\([\d.]+em - [\d.]+em\)/, rule, cls)
      assert_equal top, bottom, cls
    end
  end

  def test_home_starts_on_default_layout_with_switcher
    default = @settings['layouts'].first['id']
    assert_match(/<div class="posts" id="posts" data-post-layout="#{default}">/, @html)
  end

  def test_blog_page_is_pinned_to_index_layout
    blog = File.read(File.join(SITE, 'blog/index.html'))
    assert_match(/<div class="posts" id="posts" data-post-layout="index" data-post-layout-pinned>/, blog)
    refute_match(/data-layout=/, blog, 'pinned page should not offer the switcher')
    assert_equal items.size, blog.scan(%r{<li class="post[ "]}).size
  end
end
