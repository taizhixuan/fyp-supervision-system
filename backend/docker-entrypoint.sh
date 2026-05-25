#!/bin/sh
# Translate the Docker "_FILE" convention into plain env vars before the
# Spring app starts. Each "<NAME>_FILE=/path" becomes "<NAME>=<file-contents>".
#
# This lets docker-compose.prod.yml mount secrets at /run/secrets/* and have
# Spring read them via the same ${JWT_SECRET} placeholders used in dev.
#
# Mimics the convention already used by the official mysql / postgres images.

set -eu

for f_var in $(env | grep '_FILE=' | cut -d= -f1); do
    base_var=${f_var%_FILE}
    eval "file_path=\$$f_var"
    if [ -n "${file_path:-}" ] && [ -f "$file_path" ]; then
        value=$(cat "$file_path")
        export "$base_var=$value"
        unset "$f_var"
    fi
done

exec java -jar /app/app.jar "$@"
