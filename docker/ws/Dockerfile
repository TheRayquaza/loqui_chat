FROM node:20.12-alpine3.19

LABEL maintainer="mateo.lelong@gmail.com"

ENV ARTIFACT_ID="1475719783"
ENV GITHUB_TOKEN="xxx"

RUN addgroup -S appgroup && adduser -S appuser -G appgroup && apk add --no-cache bash curl unzip
WORKDIR /home/appuser/app

RUN curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/TheRayquaza/loqui_chat/actions/artifacts/${ARTIFACT_ID}/zip --output ws.zip && unzip ws.zip && rm ws.zip

USER appuser

CMD ["node ws.js"]