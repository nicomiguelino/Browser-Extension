FROM node:8

WORKDIR /app
RUN mkdir -p /output
RUN chmod -R 777 /output

# Use docker caching system to cache installed packages.
ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json
RUN npm install --quiet

# COPY ./ /app/

# CMD ["pause"]
#CMD ["npm", "run", "build"]
