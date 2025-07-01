- https://www.figma.com/plugin-docs/api/Variable/

# Endpoints

There are three methods provided by the Variables REST API.

GET local variables: Fetch the local variables created in the file and remote variables used in the file.

GET published variables: Fetch the variables published from this file.

POST variables: Bulk create, update, and delete local variables and variable collections.

# GET local variables

This API is available to full members of Enterprise orgs.

The GET /v1/files/:file_key/variables/local endpoint lets you enumerate local variables created in the file and remote variables used in the file. Remote variables are referenced by their subscribed_id.

As a part of the Variables related API additions, the GET /v1/files/:file_key endpoint now returns a boundVariables property, containing the variableId of the bound variable. The GET /v1/files/:file_key/variables/local endpoint can be used to get the full variable or variable collection object.

Note that GET /v1/files/:file_key/variables/published does not return modes. Instead, you will need to use the GET /v1/files/:file_key/variables/local endpoint, in the same file, to examine the mode values.

HTTP Endpoint
GET/v1/files/:file_key/variables/local

Path parameters Description
file_key String
File to get variables from. This can be a file key or branch key. Use GET /v1/files/:key with the branch_data query param to get the branch key.
Error codes Description
400 Invalid parameter. The "message" parameter on the response will describe the error.
401 Issue with authentication. The "message" parameter on the response will describe the error.
403 API is not available. Possible error messages are "Limited by Figma plan," "Incorrect account type," or "Invalid scope". This could also indicate the developer / OAuth token is invalid or expired.
Return value
{
"status": Number,
"error": Boolean,
"meta": {
"variables": {
[variableId: String]: {
"id": String,
"name": String,
"key": String,
"variableCollectionId": String,
"resolvedType": 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR'
"valuesByMode": {
[modeId: String]: Boolean | Number | String | Color | VariableAlias,
}
"remote": Boolean,
"description": String,
"hiddenFromPublishing": Boolean,
"scopes": VariableScope[],
"codeSyntax": VariableCodeSyntax,
}
},
"variableCollections": {
[variableCollectionId: String]: {
"id": String,
"name": String,
"key": String,
"modes": [
{
"modeId": String,
"name": String,
}
],
"defaultModeId": String,
"remote": Boolean,
"hiddenFromPublishing": Boolean,
"variableIds": String[],
"deletedButReferenced": Boolean,
}
}
}
}
}
Try it out for yourself
file_key
Log in to generate an access tokenWhat's this?
Your cURL command
curl -H 'X-FIGMA-TOKEN: <personal access token>' 'https://api.figma.com/v1/files/:file_key/variables/local'

# GET published variables

This API is available to full members of Enterprise orgs.

The GET /v1/files/:file_key/variables/published endpoint returns the variables that are published from the given file.

The response for this endpoint contains some key differences compared to the GET /v1/files/:file_key/variables/local endpoint:

Each variable and variable collection contains a subscribed_id .
Modes are omitted for published variable collections
Published variables have two ids: an id that is assigned in the file where it is created (id), and an id that is used by subscribing files (subscribed_id). The id and key are stable over the lifetime of the variable. The subscribed_id changes every time the variable is modified and published. The same is true for variable collections.

The updatedAt fields are ISO 8601 timestamps that indicate the last time that a change to a variable was published. For variable collections, this timestamp will change any time a variable in the collection is changed.

HTTP Endpoint
GET/v1/files/:file_key/variables/published

Path parameters Description
file_key String
File to get variables from. This must be a main file key, not a branch key, as it is not possible to publish from branches.
Error codes Description
400 Invalid parameter. The "message" parameter on the response will describe the error.
401 Issue with authentication. The "message" parameter on the response will describe the error.
403 API is not available. Possible error messages are "Limited by Figma plan," "Incorrect account type," or "Invalid scope".
