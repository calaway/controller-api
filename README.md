# Akkeris Controller API #

## Setting Up ##

### Storage 
* `DATABASE_URL` - The database url to store build, release information.  This has no default.  Must be a postgres 9.5+ instance. See create.sql in sql folder for creating the tables and schema.

### Security
* `ENCRYPT_KEY` - A private key used to encrypt secretive information in postgres.  This has no default.
* `APPKIT_UI_URL` - Public URI (https://somehost/) for the appkit ui used by developers.

### Build Information
* `DEFAULT_GITHUB_USERNAME` - When watching github source control, use this default username if none is provided.  (should be set with `DEFAULT_GITHUB_TOKEN`)
* `DEFAULT_GITHUB_TOKEN` - When watching github source control, use this default token if none is provided. (should be set with `DEFAULT_GITHUB_USERNAME`)

### Deployment Information
* `[STACKNAME]_STACK_API` - The URI for the stack api by the name of STACKNAME, for example if a stack exists called FOO the uri for the stack api must be set at FOO_STACK_API
* `[REGIONNAME]_REGION_API` - The URI for the regional api by the name of REGIONNAME, for example if a region exists called us-seattle the uri for the stack api must be set at US_SEATTLE_REGION_API
* `DOCKER_REGISTRY_HOST` - The host for storing image sources. E.g., docker.hostname.com, This has no default.
* `DOCKER_REPO` - The repo in DOCKER_REGISTRY_HOST to store gold master build images (changing this also requires changing jenkins_build_template.xml and existing build templates in jenkins). This has no default.

### Optional Environment Variables
* `TWILIO_AUTH_KEY` - The master sid:token for the twilio account.
* `ANOMALY_METRICS_DRAIN` - The syslog drain end point for the opentsdb custom metrics collector. This has no default.
* `PAPERTRAIL_DRAIN` - The syslog standard drain end point for papertrail.  This has no default.
* `AUTH_KEY` - If secure key addon isn't usued, this can be set as a shared secret simple authentication, this should be used in all API calls in the Authorization header.
* `BLACKLIST_ENV` - A comma delimited list of socs keywords causing config vars to be redacted, defaults to 'PASS,KEY,SECRET,PRIVATE,TOKEN'
* `DYNO_DEFAULT_SIZE` - The default dyno size to use. The set default is `scout` if no other is specified.

## Installing ##

```
npm install
```

## Running ##

Prior to running, ensure all of the prior environment variables are properly setup in the ENV.

```
npm start
```

## Testing and Developing Locally ##

1. Create a database for the controller

```
brew install postgresql
createdb controller-api
export DATABASE_URL=postgres://localhost:5432/controller-api
```

2. Seed test data

```
cat sql/create.sql | psql $DATABASE_URL
cat sql/create_testing.sql | psql $DATABASE_URL
```

3. Set the environment variables above, also save DATABASE_URL as part of your config/environment. There are some additional options that should be set when developing locally or testing.  Some of these are optional. The tests that run are integration tests that require real services setup. See the setting up section above for additional required environment variables.

* `TEST_REGION` - the region to test, e.g., us-seattle, eu-ireland
* `NGROK_TOKEN` - When testing a public URI is needed to test callbacks from other integrated systems, get a token at www.ngrok.com and place it in this envirionment variable.
* `ONE_PROCESS_MODE` - When developing locally this must be set, it imports what normally would be in the worker into the main process. Just set it to true
* `TEST_MODE` - Similar to ONE_PROCESS_MODE this should be set when running the automated tests, while ONE_PROCESS_MODE should be set when developing locally.  Just set it to true
* `ALAMO_BASE_DOMAIN` - This should be in the format of .some.example.com, This is the base domain to use for newly created apps.
* `SITE_BASE_DOMAIN` - This is the site base domain such as `.example.com`.
* `CODACY_PROJECT_TOKEN` - While optional this is useful when running test coverage to report the results to www.codacy.com. 
* `MARU_STACK_API` - Set to the alamo api, MARU is the name of our test cluster
* `US_SEATTLE_REGION_API` - Set to the alamo api, US_SEATTLE is the name of our test region.
* `ALAMO_APP_CONTROLLER_URL` - The API url for this host, you'll want to set this to http://localhost:5000
* `BUILD_SHUTTLE_URL` - The build shuttle is a small footprint API that manages specific build system such as jenkins. (see https://github.com/akkeris/buildshuttle).  This has no default.
* `APPKIT_API_URL` - Public URI (https://somehost/) for the appkit api in front of this api, generally appkit api url that handles user account/authorization (defaults to http://localhost:5000)
* `TEST_ONPREM_POSTGRES` - whether to test the onprem postgres brokers.
4. Run the entire test suite:

```
npm test
```

5. OR, run an individual test manually:

```
./node_modules/.bin/_mocha test/[test_to_run.js]
```

## Contributing ##

### How Authentication Works ###

The alamo app controller uses a simple key based authorization via http in the "Authorization" header.  For example if your AUTH_KEY is `fugazi` then you would pass in `Authorization: fugazi` with all your http requests to authenticate it.  In addition a `X-Username` is required which contains the username or email address of the user taking the action. Note that this api is not intended to be exposed directly to people but other systems, developers interface through appkit-api project which handles permissions and passes requests through.

### Listening to Events ###

To help decouple actions events my be emited by a central bus within the `common.js` file.  The exported module will have a globally unique (across one dyno instance) "lifecycle" object that implements an Event Emitter pattern in node.  The following events are emitted:

* `preview-created`
* `build-status-change`
* `release-started`
* `release-successful`
* `release-failed`
* `released`
* `git-event`

Note these are not the same concept as web hooks nor should they be confused with that.  In addition there is a lifecycle.js file which is not the same concept as this (just unfortunately named the same).

