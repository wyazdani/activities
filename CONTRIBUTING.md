# Contributing guidelines

## Communication
Communication will be done via [slack](https://slack.com/) or [google meet](https://meet.google.com/).
Ideally we would have a daily standup, which will be at an agreed upon time.

## Using additional npm libraries, not already in package.json
Each lib will need to be review and evaluated before it can be used within the project. If you feel that there are benefits to adding a particular
lib, ping the relevant person and get approval.

## Issues
Each ticket in a project will be broken down to a single or small set of required features. If you feel the scope of the ticket is too large, speak to the relevant person.
PRs should be created per ticket.

## Linting
Linting is enforced using [eslint](http://eslint.org/).

## Workflow & Process
Outlines the process and steps to be followed for contributions to the project.

### Step 1: Clone the project
Clone the project.

### Step 2: Branch
You should assign yourself to the ticket you are about to start working on.
You should now remove the `Ready` label and apply the `Working` label for the ticket you are working on.
Create a branch before you start coding on a ticket, do not work on your master branch.
Read through the ticket, and buddy with the creator to ensure that everything is understood and requirements are clear.
If there are any questions / comments feel free to ask them on the issue / via slack message / google meet.
Your local branch name can be anything to your liking, when pushing to the main repo follow the naming conventions outlined [here](#branch-naming-conventions)

### Step 3: Commit
Each commit should be related to a single ticket. Messages should be clear and contain details relating to the change
A commit message should also contain a reference to the issue.

An example commit message
```
One line summary of the commit

More detailed description of the changes made within this commit

Issue: link to the current ticket you are working on
```

### Step 4: Sync with main repo
Before testing / pushing / creating a PR to master, you will need to make sure that you are up to date with master.

### Step 5: Testing
Refer to [here](#required-test-cases) for all the test cases that are required.
You are required to run all test cases locally.
```
NODE_ENV=testing npm run test
```

You are also required to run code coverage locally.
```
npm run code-coverage
```

You are also required to run all your linting locally.
```
npm run lint
```

### Step 6: Pushing to main repo
You should be pushing on a regular basis, and you should do an end of day commit everyday.
Once you have feel you have completed the requirements on the ticket create the PR (if you have not already done so).
Note that each push to the main repo will kick off various processes:
* Codeship Builds

If you want to prevent certain processes from firing you can use the following flags in your commit
* Codeship Build
  * `--skip-ci`

### Step 7: Review process
You should now remove the `Working` label and apply the `Complete` label for the ticket you are working on.
This process will ensure that the requirements have been covered, and also a review on the actual code submitted.

Code will be evaluated for readability and whether or not it meets the coding standards. Code should meet coding standards defined in the provided eslint configurations.

Code should at all times be easy to read and understand. Each function should always have a function comment that explains the purpose of the function, the function parameters, the type for each parameter and the return data.

### Step 8: Tagging
After review process code will be tagged. Our tagging process follows [semantic versioning](http://semver.org/). An image is created for this tag.

### Step 9: Beta Testing
We will now remove the `Complete` label and apply the `Beta Deploy` label for the ticket you are working on.
After the tagging process, the image is deployed to our local beta environment. This process will entail one or more people testing the PR for all requirements.

### Step 10: Production and Merging
After a successful Beta Testing step, the same image is deployed to our production environment. After all checks have passed, the code is merged into our master branch.
We will now remove the `Beta Deploy` label and apply the `Production` label for the ticket you are working on.
The ticket is then closed.

## References:

### Branch Naming Conventions
The branch name should contain a short feature description and the ticket number the branch is related to at the end of the branch name.

**Example branch names:**
 * implement-logging-3
 * some-other-feature-44
 * bugfix-all-logs-info-23
 * hotfix-invalid-age-validation-21

### Required Test Cases

#### Unit tests
When new code is committed the code should have unit tests that covers at least 90% of the code if this requirement is not met code will not be allowed to be merge to the master branch.

The following types of unit tests are required for each function.  Unit tests should mock all external functions that retrieve data.
 * **Validation tests**
   * These should test that the validation of function parameters are working correctly and that the correct function responses/exceptions are thrown.
 * **Result test cases**
   * These test should test function responses and should test all branches in the functions logic.

#### Endpoint Test Cases
These are black box test cases, and should cover the following scenarios
* A success response from the route
* A single validation error test case needs to be added.