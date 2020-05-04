# Setup the environment
FROM node:10-alpine
ENV NODE_ENV=production
ENV APP=/home/node/app
RUN mkdir -p $APP/node_modules && chown -R node:node /home/node/*
WORKDIR $APP
# Copy over package related files to install production modules
COPY --chown=node:node ./package*.json ./
COPY --chown=node:node ./bin/copy-assets-to-public.sh ./bin/
# Install production dependencies
RUN npm i --only=production --quiet
# Copy local code to the image
COPY --chown=node:node ./public ./public/
COPY --chown=node:node ./server.js ./
# List off contents of final image
RUN ls -la $APP
# Expose the default port from the server, on the container
EXPOSE 3000
# Start the app
CMD ["node", "server.js"]
