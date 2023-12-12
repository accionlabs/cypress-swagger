FROM alpine as clone

WORKDIR /app

RUN apk update && apk add --no-cache git
RUN git clone https://github.com/ShivasaiMandepally/cypress-codgen.git .

FROM cypress/base:latest
WORKDIR /app

# Copy files from the previous stage (e.g., build artifacts)
COPY --from=clone /app /app
RUN npm install

# This has to be replaced with CMD ["npm", "run", "test"] once the source code is changed.
CMD ["npx", "cypress", "run"]
