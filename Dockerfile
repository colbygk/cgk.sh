FROM jekyll/builder:3.8.5
COPY --chown=jekyll:jekyll . /srv/jekyll
WORKDIR /srv/jekyll
RUN bundle install
EXPOSE 8086/tcp
CMD ["jekyll", "serve", "--host", "0.0.0.0", "--port", "8086", "--force_polling"]
