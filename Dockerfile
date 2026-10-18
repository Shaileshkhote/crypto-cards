FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV COREPACK_HOME=/pnpm/corepack
ENV NODE_USE_ENV_PROXY=1
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
RUN --mount=type=secret,id=build_ca,mode=0444 \
    if [ -f /run/secrets/build_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/build_ca; fi; \
    corepack enable && corepack prepare pnpm@11.25.0 --activate && \
    chown -R node:node /pnpm

FROM base AS dependencies
COPY --chown=node:node . .
RUN --mount=type=secret,id=build_ca,mode=0444 \
    --mount=type=cache,id=cards-pnpm,target=/pnpm/store \
    if [ -f /run/secrets/build_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/build_ca; fi; \
    pnpm install --frozen-lockfile --store-dir /pnpm/store && chown -R node:node /app

FROM dependencies AS build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build && chown -R node:node apps/admin/.next

FROM build AS admin
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["pnpm","--filter","@cards/admin","start"]

# Keep OS/browser installation independent of application source changes.
FROM base AS browser
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
# Bootstrap HTTPS trust before the slim image installs its OS CA package.
RUN --mount=type=secret,id=build_ca,mode=0444 \
    sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources && \
    node -p "require('tls').rootCertificates.join('\n')" > /tmp/cards-apt-ca.pem && \
    if [ -f /run/secrets/build_ca ]; then \
      cat /run/secrets/build_ca >> /tmp/cards-apt-ca.pem; \
    fi && \
    apt-get -o Acquire::https::CaInfo=/tmp/cards-apt-ca.pem update && \
    apt-get -o Acquire::https::CaInfo=/tmp/cards-apt-ca.pem install -y --no-install-recommends chromium ca-certificates && \
    rm -rf /var/lib/apt/lists/* /tmp/cards-apt-ca.pem

FROM browser AS worker
COPY --from=dependencies --chown=node:node /app /app
ENV NODE_ENV=production
USER node
CMD ["sh","-c","pnpm db:migrate && exec pnpm worker"]
