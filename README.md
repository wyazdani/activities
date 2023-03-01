# activities
Stores activities that was done by users on the system for history purposes

## Service name on cluster
The service name in deployments is: `activities-v3-for-ss`

## Making use of private npm modules
We have tried to centralise some of the commonly used code into private npm repos.
You will need to have access to each of these to do an npm install
* https://github.com/A24Group/a24-logzio-winston
* https://github.com/A24Group/A24NodeUtils
* https://github.com/A24Group/A24NodeTestUtils

You will need to familiarise with each of these before writing any code on this project.
If there are any questions / bugs / suggestions, contact the relevant person so they are able
to create a ticket on the related project.

## Documentation
Listing of documentation that may prove useful
* [sinon](http://sinonjs.org/releases/) - Make sure you view the docs of the correct version, see the `package.json` for more details.
* [eslint](http://eslint.org/) - Make sure you view the docs of the correct version, see the `package.json` for more details.

## Contributing to the Project
[Here](CONTRIBUTING.md) is a detailed look at the process to follow.

### Developer's Certificate of Origin
By making a contribution to this project, I certify that:

* (a) The contribution was created in whole or in part by me and I have the right to submit it under the open source license indicated in the file; or

* (b) The contribution is based upon previous work that, to the best of my knowledge, is covered under an appropriate open source license and I have the right under that license to submit that work with modifications, whether created in whole or in part by me, under the same open source license (unless I am permitted to submit under a different license), as indicated in the file; or

* (c) The contribution was provided directly to me by some other person who certified (a), (b) or (c) and I have not modified it.

### Client Generation Problem and Solution
Issues: We have added a multiple datatypes support in definition of advanced search that are in `a24-node-advanced-query-utils.swagger_api_path`.

Temporary solution: Created a temporary valid swagger file in `a24-node-advanced-query-utils.temp_fix_swagger_api_path`

Steps to generate Client:
* Run the script added in `toools/tempMergeSwaggerScript.js`
* Now, use the `tools/finalSwaggerDocs.yaml` to generate the client
  * For prompt `The absolute path to swagger(The swagger used for generating the client)` - `activities/tools/finalSwaggerDocs.yaml`