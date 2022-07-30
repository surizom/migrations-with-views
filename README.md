# Using PostgreSQL views to ensure backwards-compatible, non-breaking migrations

This repository illustrates the possibility of using views to conduct backwards-compatible migrations.

It consists of a unit test (file viewMigration.test.ts) using an in-memory PostgreSQL database (node package pg-meme)

You can run it on your local machine by executing `yarn install && yarn test`
