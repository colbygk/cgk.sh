# Every local image, video and file link in a built post must resolve to
# a file in the build. Run against a fresh build:
#
#   docker exec cgkyll-dev sh -c \
#     'jekyll build -d /tmp/verify && SITE=/tmp/verify ruby test/post_assets_test.rb'
require 'minitest/autorun'
require 'cgi'

SITE = ENV.fetch('SITE', '_site')

class PostAssetsTest < Minitest::Test
  # Local references to files (not pages): /files/…, /images/…, etc.
  REF = %r{(?:src|href|data|poster)="(/(?:files|images)/[^"#?]+)"}

  def test_local_files_referenced_by_posts_exist
    missing = Dir[File.join(SITE, 'blog/*.html')].flat_map do |page|
      File.read(page).scan(REF).flatten.uniq.reject do |ref|
        File.exist?(File.join(SITE, CGI.unescape(ref)))
      end.map { |ref| "#{File.basename(page)}: #{ref}" }
    end
    assert_empty missing, "Missing files:\n  #{missing.join("\n  ")}"
  end
end
