FROM node:8.2.1

# basic system update
RUN apt-get update && apt-get install -y \
      && rm -rf /var/lib/apt/lists/*

# create a workspace
RUN mkdir -p /tmp/webaudio
WORKDIR /tmp/webaudio

# install dependencies
COPY package.json /tmp/webaudio
RUN npm install

# copy project files into the container
COPY . /tmp/webaudio

# build
RUN npm run build
RUN echo build done

# expose 3000 as normal - expose 80 for docker run command for deployment
EXPOSE 3000
ENTRYPOINT ["npm", "run", "start"]
