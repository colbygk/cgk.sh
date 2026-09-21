# Fails the build when two posts share a title (case, punctuation and
# whitespace ignored). Hand-curated posts have re-done several Drupal
# imports; this keeps a re-done post and its original from both shipping.
module CgkSh
  module DuplicatePosts
    def self.key(title)
      title.to_s.downcase.gsub(/[^a-z0-9]+/, ' ').strip
    end

    def self.duplicates(posts)
      posts.group_by { |p| key(p.data['title']) }
           .select { |k, group| !k.empty? && group.size > 1 }
           .values
    end
  end
end

Jekyll::Hooks.register :site, :post_read do |site|
  dups = CgkSh::DuplicatePosts.duplicates(site.posts.docs)
  next if dups.empty?

  list = dups.map { |g| g.map(&:relative_path).join(' == ') }.join("\n  ")
  raise Jekyll::Errors::FatalException, "Duplicate posts:\n  #{list}"
end
