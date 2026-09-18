require 'yaml'

# Drupal exported posts with image/audio/video tags pointing at
# /webfm_send/<fid>. The fid -> file-path mapping lives in
# _data/webfm.yml (regenerated from old-shrewdraven/webfm_files.ndjson).
#
# This plugin rewrites every /webfm_send/<fid> reference in rendered post,
# page and project output to /files/<relative-path>, where <relative-path>
# is the original Drupal `sites/default/files/...` location with that
# prefix stripped. Drop the actual binaries under `files/<relative-path>`
# in the repo to make them resolve in the built site.
module CgkSh
  module Webfm
    PATTERN = %r{(["'])/webfm_send/(\d+)\1}

    def self.mapping(site)
      @mapping ||= begin
        data = site.data['webfm']
        files = data && data['files']
        if files.is_a?(Hash)
          files.each_with_object({}) do |(fid, info), acc|
            rel = info.is_a?(Hash) ? info['rel'] : nil
            acc[fid.to_i] = "/files/#{rel}" if rel
          end
        else
          {}
        end
      end
    end

    def self.rewrite(html, mapping)
      return html unless html.is_a?(String) && html.include?('webfm_send')
      html.gsub(PATTERN) do
        quote = Regexp.last_match(1)
        fid   = Regexp.last_match(2).to_i
        dest  = mapping[fid]
        dest ? "#{quote}#{dest}#{quote}" : Regexp.last_match(0)
      end
    end
  end
end

Jekyll::Hooks.register [:documents, :pages], :post_render do |doc|
  next unless doc.output
  mapping = CgkSh::Webfm.mapping(doc.site)
  next if mapping.empty?
  doc.output = CgkSh::Webfm.rewrite(doc.output, mapping)
end
