FROM node:8.0

# update os
RUN apt-get update && apt-get install -y

# create workspace
RUN mkdir -p /tmp/audioeditor
WORKDIR /tmp/audioeditor

# copy materials
COPY . /tmp/audioeditor
RUN npm install

# run server
EXPOSE 4001
ENTRYPOINT ["npm", "run", "bstart"]
