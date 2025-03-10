# Milestone 1

## Endpoints

## Running the app

Prerequisites:

1. NodeJS installed
2. Yarn installed

Install dependencies

```bash
yarn
```

### Run Elastic search

```bash
./scripts/run-es-in-docker.sh
```

Then start the service in dev-mode:

```bash
yarn dev
```

## Tests

### Unit tests

Fast tests that verify units of code isolated from external dependencies. You
should be able to run these even if you're working offline.

```bash
yarn test:unit
```

## MILESTONE 1
### HTTP requests 

[users.http](restapi/users.http)

## MILESTONE 2
### HTTP requests

[milestone_2.http](restapi/milestone2.http)



## Notes
App will be ready to release on production when:
- create the pipeline (CI/CD) with all kind of tests: unit, acceptance and e2e
- add swagger documentation as a public api for external clients
- create elasticsearch instance on production and define mapping for index (ex. use x-pack for additional security )
- increase cover by tests
- add metrics for app on production - monitoring