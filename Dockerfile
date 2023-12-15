ARG FUNCTION_DIR="/function"

FROM node:20-buster as build-image

ARG FUNCTION_DIR

RUN apt-get update && \
    apt-get install -y \
    g++ \
    make \
    cmake \
    unzip \
    libcurl4-openssl-dev

RUN mkdir -p ${FUNCTION_DIR}
WORKDIR ${FUNCTION_DIR}

COPY . .
RUN npm install

# Install the runtime interface client
RUN npm install aws-lambda-ric

FROM cypress/base:latest

# Required for Node runtimes which use npm@8.6.0+ because
# by default npm writes logs under /home/.npm and Lambda fs is read-only
ENV NPM_CONFIG_CACHE=/tmp/.npm

ARG FUNCTION_DIR
COPY --from=build-image ${FUNCTION_DIR} ${FUNCTION_DIR}

WORKDIR ${FUNCTION_DIR}

RUN apt-get update && \
    apt-get install -y git

RUN npm install -g prettier@3.1.1

# Set runtime interface client as default command for the container runtime
ENTRYPOINT ["/usr/local/bin/npx", "aws-lambda-ric"]

# Pass the name of the function handler as an argument to the runtime
CMD ["index.handler"]
