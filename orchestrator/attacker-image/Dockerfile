# Minimal "attacker" box for the lab: a shell reachable only via an
# embedded web terminal (ttyd) baked into the image itself — the
# orchestrator never needs `docker exec` (kept disabled on the socket
# proxy, see ../docker-compose.yml) to give a user a terminal.
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      nmap \
      netcat-traditional \
      curl \
      dnsutils \
      iputils-ping \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL -o /usr/local/bin/ttyd \
      https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64 \
    && chmod +x /usr/local/bin/ttyd

RUN useradd -m -s /bin/bash lab
USER lab
WORKDIR /home/lab

EXPOSE 7681
# -W makes the in-browser shell writable/interactive; no auth here because
# the port is only reachable inside the per-user Docker network + a
# short-lived, per-lab published port — see orchestrator/src/labs.js.
CMD ["ttyd", "-p", "7681", "-W", "bash"]
