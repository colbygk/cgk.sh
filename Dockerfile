from node:10

RUN mkdir -p /cgk.sh
WORKDIR /cgk.sh
COPY . ./
RUN rm -rf ./node_modules
RUN npm install total.js

EXPOSE 8551
