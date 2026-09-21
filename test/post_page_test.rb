# Checks built post pages: header markup, the serif body font, and the
# styles the Drupal-imported markup relies on. Run against a fresh build:
#
#   docker exec cgkyll-dev sh -c \
#     'jekyll build -d /tmp/verify && SITE=/tmp/verify ruby test/post_page_test.rb'
require 'minitest/autorun'
require 'yaml'

SITE = ENV.fetch('SITE', '_site')

class PostPageTest < Minitest::Test
  def setup
    @settings = YAML.safe_load(File.read('_data/settings.yml'))['font_settings']
    @css = File.read(File.join(SITE, 'css/style.css'))
    @seti = File.read(File.join(SITE, 'blog/seti-searching-habitable-zone-kois.html'))
  end

  def test_header_has_date_then_title
    assert_match(%r{<time class="post-page__date" datetime="2011-02-03[^"]*">3 February 2011</time>\s*<h1 class="post-page__title">SETI searching habitable zone KOIs</h1>}, @seti)
  end

  def test_every_post_uses_the_post_page_layout
    slugs = Dir['_posts/*.md'].map { |f| File.basename(f, '.md').sub(/^\d{4}-\d\d-\d\d-/, '') }
    slugs.each do |s|
      assert_includes File.read(File.join(SITE, "blog/#{s}.html")), 'class="single post-page__body"', s
    end
  end

  def test_body_font_is_defined_once_in_settings_and_loaded
    font = @settings['post_body_font']
    assert_match(/Literata/, font)
    assert_match(/family=Literata/, @seti[0, @seti.index('</head>')])
    compressed = font.chomp(';').gsub(/,\s+/, ',')
    assert_match(/\.post-page__body\{[^}]*font-family:#{Regexp.escape(compressed)}/, @css)
  end

  def test_imported_float_classes_float
    assert_match(/\.post-page__body \.img-float-right\{[^}]*float:right/, @css)
    assert_match(/\.post-page__body \.img-float-left\{[^}]*float:left/, @css)
  end

  # Two adjacent floats sit side by side in either order; whatever follows
  # the pair must start below both, not in the gap between them.
  def test_content_after_a_float_pair_clears_in_either_order
    rule = @css[/[^}]*\{clear:both\}/].to_s
    assert_includes rule, '.post-page__body .img-float-left+.img-float-right+*'
    assert_includes rule, '.post-page__body .img-float-right+.img-float-left+*'
  end

  # Leftovers from the Drupal import must not show up as visible text:
  # raw {syntaxhighlighter} code markup, or HTML tags escaped into prose.
  def test_no_import_markup_leaks_into_posts
    leaks = Dir[File.join(SITE, 'blog/*.html')].flat_map do |page|
      body = File.read(page)[/<section class="single post-page__body">.*?<\/section>/m].to_s
      prose = body.gsub(%r{<pre.*?</pre>}m, '')
      found = prose.scan(/\{\/?syntaxhighlighter[^}]*\}|&lt;\/?(?:p|a|ul|ol|li|div|br|img|span)\b[^&]*&gt;/)
      found.uniq.map { |f| "#{File.basename(page)}: #{f}" }
    end
    assert_empty leaks, "Import markup showing as text:\n  #{leaks.join("\n  ")}"
  end

  # Browsers dropped Flash; video embeds must be players that still work.
  def test_no_flash_embeds
    flash = Dir[File.join(SITE, 'blog/*.html')].select { |f| File.read(f) =~ /\.swf|x-shockwave-flash|youtube(?:-nocookie)?\.com\/v\// }
    assert_empty flash.map { |f| File.basename(f) }
  end

  def test_links_are_not_bold_in_post_body
    assert_match(/\.post-page__body p a\{[^}]*font-weight:inherit/, @css)
  end
end
