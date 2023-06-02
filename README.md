# Getting Started
### First Steps
- Fork this repo
- Rename the repo to the new project`s name
- Clone the forked repo
- Add the starter kit repo as a remote with the name `base`
- In your forked repository, go to Settings→Webhooks
- Click Add webhook
- Set Payload URL to the Pull Review server URL (http://sourcegraph.kushkipagos.com:8080/)
- Set Content type to application/json
- Choose Let me select individual events
- Pick the Issue comment event
- Click Add webhook
- Enable project on [snyk](https://snyk.io)
- Enable github repo con slack channel #github `/github subscribe kushki/repo-name`
- Update the README

### Rollbar
- Create project on rollbar
- Go to settings/Source control/
- Put `/src` as project root
- Go to settings/Notifications/
- At the end of the page choose copy notification from project and select `usrv-starter-kit`
### Pagerduty
- Create a service on Pagerduty.
- Copy all the integration from the service `usrv-starter-kit`
### Runscope
- Create a bucket with the same name of the project
### Update changes from starter-kit
- Make a pull from the `base` remote reference.

<!--- Here start the README template for the project -->
# @kushki/usrv-name
Base project for Kushki Microservices
### Request a PR review
To request a review left a comment with the text `/review`
## Prerequisites
- Typescript
- Mocha
- Serverless
## Deploy
PROD, UAT
```
Merge with master 
```
QA - STG
```
Merge with release/XXXX to deploy or push to hotfix/XXXX
```
CI
```
Push to feature/XXXX
```
## Running the tests

Run
```shell
npm run validate
```

## You must know

Read about Serverless and Typescript to edit this project. You must not commit at develop and master branches.
You must create a pull request to merge your code. 

* .envrc base on the example (ignore this file)
## Built With
* [Serverless](https://serverless.com/framework/docs/) - The backend framework used
* [Typescript](https://www.typescriptlang.org/) - Code
* [RxJS](http://reactivex.io/rxjs/) - Reactive programming
## Authors
* **Kushki Dev Team**
* **Jose Santacruz** - *Initial work* - [github](https://github.com/joseSantacruz)

## Checklist

- [ ] [Rollbar](https://rollbar.com/kushki/XXXX)
- [ ] [Runscope Integration](https://www.runscope.com/radar/xxxxx/xxxxxx/overview)
- [ ] [Runscope Monitor](https://www.runscope.com/radar/v0wwissdy058/xxxxxx/overview)
- [ ] [Pagerduty](https://kushki.pagerduty.com/services/XXXX)


## Acknowledgments

“With great power comes great responsibility” - Peter Parker
