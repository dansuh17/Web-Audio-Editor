FROM node:8.2.1

RUN apt-get update && apt-get install -y \
      && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /tmp/webaudio
WORKDIR /tmp/webaudio

COPY . /tmp/webaudio

RUN npm install
RUN npm run build

EXPOSE 3000
ENTRYPOINT ["npm", "run", "start"]
