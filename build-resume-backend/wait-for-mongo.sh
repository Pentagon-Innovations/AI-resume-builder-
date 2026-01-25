#!/bin/sh
echo "Waiting for MongoDB to be ready..."
until nc -z -v -w30 mongodb 27017; do
  echo "Waiting for MongoDB..."
  sleep 5
done
echo "MongoDB is up - starting backend."
exec "$@"
