FROM jekyll/builder:3.8.5
COPY . /srv/jekyll
WORKDIR /srv/jekyll
RUN bundle install
EXPOSE 4000/tcp
