FROM node:8.2.1

# basic system update
RUN apt-get update && apt-get install -y \
      && rm -rf /var/lib/apt/lists/*

# create a workspace
RUN mkdir -p /tmp/webaudio
WORKDIR /tmp/webaudio

# copy project files into the container
COPY . /tmp/webaudio

# install dependencies and build
RUN npm install
RUN npm run build

# expose 3000 as normal - expose 80 for docker run command for deployment
EXPOSE 3000
ENTRYPOINT ["npm", "run", "start"]
